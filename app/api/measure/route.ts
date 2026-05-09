import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { readFile } from "fs/promises"
import { join } from "path"
import { slugify } from "@/app/lib/slug"

// 300s: real pipeline runs land at 90-220s; 120s timed out on a successful
// run roughly half the time and the UI showed an error on real success.
export const maxDuration = 300

function runPipeline(address: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", ["scripts/estimate.mjs", address, "--no-cache"], {
      cwd: process.cwd(),
      env: { ...process.env },
    })
    proc.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Pipeline exited with code ${code}`))
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
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
    stub:                 !!(measurement.pitch_stub || measurement.footprint_stub),
  })
}
