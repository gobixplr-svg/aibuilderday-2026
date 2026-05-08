import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { readFile, access } from "fs/promises"
import { join } from "path"

export const maxDuration = 120

function slugify(address: string): string {
  return address.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

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
