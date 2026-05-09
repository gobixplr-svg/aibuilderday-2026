import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { slugify } from "@/app/lib/slug"

// 300s: real pipeline runs land at 90-220s; 120s timed out on a successful
// run roughly half the time and the UI showed an error on real success.
export const maxDuration = 300

type PipelineError = Error & { code?: string }

async function runPipeline(address: string): Promise<void> {
  // Both child_process and the spawn-arg array are opaque to Turbopack's
  // static analyzer here: spawn() is loaded via a string-keyed dynamic
  // import that the analyzer can't constant-fold, and the script path
  // is read off process.env so it's a runtime value, not a literal.
  // Next.js 16 + Turbopack mis-treats spawn()'s string args as module
  // specifiers without these dodges (vercel/next.js #86458 family).
  const cp = await import(/* webpackIgnore: true */ "node:child_process")
  const cwd = process.cwd()
  const scriptPath = process.env.ROOF_RECON_SCRIPT_PATH ?? join(cwd, "scripts", "estimate.mjs")

  return new Promise((resolve, reject) => {
    const proc = cp.spawn(process.execPath, [scriptPath, address, "--no-cache"], {
      cwd,
      env: { ...process.env },
    })

    // Capture stderr so we can distinguish "address didn't resolve to a
    // residential roof" (a user-friendly 422) from real pipeline errors.
    let stderr = ""
    proc.stderr?.on("data", (chunk) => { stderr += chunk.toString() })
    // Also tee stderr to our own stderr so the dev console still shows it.
    proc.stderr?.pipe(process.stderr)
    proc.stdout?.pipe(process.stdout)

    proc.on("close", (code) => {
      if (code === 0) {
        resolve()
        return
      }
      // Pattern-match the NO_ROOF_DETECTED signal that scripts/lib/claude.mjs
      // emits when Claude refuses to call the tool because the image doesn't
      // show a residential pitched roof. Per CLAUDE.md hard rule #2, we'd
      // rather refuse than fabricate a measurement.
      if (/NO_ROOF_DETECTED|No residential roof detected/i.test(stderr)) {
        const err: PipelineError = new Error(
          "We couldn't find a residential roof at that address. The address may have geocoded to a commercial street, parking lot, or empty parcel. Try a more specific address (e.g. include the unit or check the street name)."
        )
        err.code = "NO_ROOF_DETECTED"
        reject(err)
        return
      }
      reject(new Error(`Pipeline exited with code ${code}`))
    })
    proc.on("error", reject)
  })
}

// Normalize pitch "6:12" → "6/12" for display
function normalizePitch(pitch: string): string {
  return pitch.replace(":", "/")
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const address: string = body?.address
  if (!address || typeof address !== "string") {
    return NextResponse.json({ error: "address is required" }, { status: 400 })
  }

  try {
    await runPipeline(address.trim())
  } catch (err) {
    const e = err as PipelineError
    // 422 (Unprocessable Entity) for "we couldn't find a roof" — semantically
    // the request was well-formed, we just couldn't act on it. Distinguishes
    // from 500 (real bug) so the UI can present a friendly message instead
    // of raw pipeline internals.
    const status = e?.code === "NO_ROOF_DETECTED" ? 422 : 500
    return NextResponse.json(
      { error: e?.message ?? "Pipeline failed", code: e?.code },
      { status }
    )
  }

  const slug = slugify(address.trim())
  const outDir = join("outputs", slug)

  const [measurementRaw, estimateRaw] = await Promise.all([
    readFile(join(outDir, "measurement.json"), "utf-8"),
    readFile(join(outDir, "estimate.json"), "utf-8"),
  ])

  const measurement = JSON.parse(measurementRaw)
  const estimate = JSON.parse(estimateRaw)

  const sqft: number = measurement.roof_area_sqft

  const TIER_NAME_MAP: Record<string, string> = {
    standard: "Standard",
    premium:  "Premium",
    luxury:   "Luxury",
  }

  const tiers = (estimate.tiers as Array<{ tier_id: string; lines: Array<{ amount: number }> }>).map((t) => {
    const total = t.lines.reduce((sum, l) => sum + l.amount, 0)
    return {
      name:      TIER_NAME_MAP[t.tier_id] ?? t.tier_id,
      total:     Math.round(total),
      per_sqft:  sqft > 0 ? Math.round((total / sqft) * 100) / 100 : 0,
    }
  })

  return NextResponse.json({
    address:              address.trim(),
    sqft,
    footprint_sqft:       measurement.footprint_sqft ?? null,
    footprint_confidence: measurement.footprint_confidence ?? null,
    pitch:                normalizePitch(measurement.pitch ?? ""),
    pitch_confidence:     measurement.pitch_confidence ?? 0,
    tiers,
    condition:            measurement.condition ?? null,
    stub:                 !!(measurement.pitch_stub || measurement.footprint_stub),
  })
}
