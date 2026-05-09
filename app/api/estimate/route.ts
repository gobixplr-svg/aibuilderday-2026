import { NextRequest, NextResponse } from "next/server"
import { readFile, access } from "fs/promises"
import { join } from "path"
import { slugify } from "@/app/lib/slug"

// 300s: see /api/measure for rationale.
export const maxDuration = 300

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function runPipeline(address: string): Promise<void> {
  // See app/api/measure/route.ts for why this is dynamically imported.
  const cp = await import(/* webpackIgnore: true */ "node:child_process")
  const cwd = process.cwd()
  const scriptPath = process.env.ROOF_RECON_SCRIPT_PATH ?? join(cwd, "scripts", "estimate.mjs")

  return new Promise((resolve, reject) => {
    const proc = cp.spawn(process.execPath, [scriptPath, address, "--no-cache"], {
      cwd,
      env: { ...process.env },
    })
    proc.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Pipeline exited with code ${code}`))
    })
    proc.on("error", reject)
  })
}

export async function POST(req: NextRequest) {
  const { address } = await req.json()
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
  const pdfPath = (await fileExists(join(outDir, "estimate.pdf"))) ? join(outDir, "estimate.pdf") : undefined

  return NextResponse.json({ slug, measurement, estimate, pdfPath })
}
