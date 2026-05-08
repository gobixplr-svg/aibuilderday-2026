#!/usr/bin/env node
// scripts/estimate.mjs
//
// Single-command pipeline runner. Address in → measurement.json + estimate.pdf.
//
// Pipeline:
//   1. fetchAerialPipeline (real)        — geocode + Static Maps satellite
//   2. estimatePitch (stub → #2)          — Claude vision: roof pitch
//   3. estimateFootprint (stub → #3)      — Claude vision: footprint + line items
//   4. compute roof_area_sqft = footprint × pitch_multiplier
//   5. buildEstimate (stub → #6)          — measurement → priced bid (3 tiers)
//   6. renderEstimatePdf (stub → #7)      — bid → branded PDF
//
// Outputs (per-property):
//   intermediate/<slug>/   — cache: aerial, geocode, vision results
//   outputs/<slug>/        — submission artifacts: aerial, measurement, estimate.pdf
//
// Usage:
//   node scripts/estimate.mjs "21106 Kenswick Meadows Ct, Humble, TX 77338"
//   node scripts/estimate.mjs "<address>" --no-cache
//
// Exit codes:
//   0 success, 1 bad usage, 2 pipeline error.

import "./lib/env.mjs"
import { mkdir, writeFile, readFile, copyFile, access } from "fs/promises"
import { join } from "path"
import { fetchAerialPipeline } from "./lib/aerial-pipeline.mjs"
import { estimatePitch, pitchMultiplier } from "./lib/pitch.mjs"
import { estimateFootprint } from "./lib/footprint.mjs"
import { loadMaterials, buildEstimate } from "./lib/estimate.mjs"
import { renderEstimatePdf } from "./lib/pdf.mjs"
import { annotateAerial } from "./lib/scale-bar.mjs"

const args = process.argv.slice(2)
if (args.length === 0 || args[0].startsWith("--")) {
  console.error("Usage: node scripts/estimate.mjs \"<address>\" [--no-cache]")
  process.exit(1)
}

const address = args[0]
const noCache = args.includes("--no-cache")

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function run() {
  console.log(`\n=========================================`)
  console.log(`[estimate] ${address}`)
  console.log(`=========================================\n`)

  // 1. Geocode + aerial
  console.log(`--- Step 1/6: Geocode + aerial ---`)
  const { slug, dir, geo, meta, aerialPath } = await fetchAerialPipeline({ address, noCache })

  // 2-3. Pitch + footprint (parallel)
  console.log(`\n--- Steps 2-3/6: Pitch + footprint (parallel) ---`)

  const annotatedPath = join(dir, "aerial-annotated.jpg")
  if (!(await exists(annotatedPath))) {
    console.log(`[annotate] writing scale bar`)
    await annotateAerial({
      inputPath: aerialPath,
      outputPath: annotatedPath,
      feetPerPixel: meta.feet_per_pixel,
    })
  }

  const pitchPath = join(dir, "vision-pitch.json")
  const areaPath = join(dir, "vision-area.json")

  async function loadOrCompute(path, label, compute) {
    if (!noCache && (await exists(path))) {
      console.log(`[${label}] cache hit`)
      return JSON.parse(await readFile(path, "utf-8"))
    }
    const result = await compute()
    await writeFile(path, JSON.stringify(result, null, 2))
    return result
  }

  const [pitch, area] = await Promise.all([
    loadOrCompute(pitchPath, "pitch", () =>
      estimatePitch({
        aerialPath,
        lat: geo.lat,
        lng: geo.lng,
        slug,
        scale: meta.feet_per_pixel,
      }),
    ),
    loadOrCompute(areaPath, "footprint", () =>
      estimateFootprint({
        aerialPath,
        lat: geo.lat,
        lng: geo.lng,
        slug,
        scale: meta.feet_per_pixel,
      }),
    ),
  ])

  console.log(`[pitch] ${pitch.pitch} (confidence ${pitch.confidence})${pitch.stub ? " [STUB]" : ""}`)
  console.log(`[footprint] ${area.footprint_sqft} sqft (confidence ${area.confidence})${area.stub ? " [STUB]" : ""}`)
  console.log(`[footprint] line items: ${JSON.stringify(area.line_items)}`)

  // 4. Compute roof_area_sqft
  console.log(`\n--- Step 4/6: Roof area ---`)
  const mult = pitch.pitch_multiplier ?? pitchMultiplier(pitch.pitch)
  if (!mult) {
    throw new Error(`[area] no pitch multiplier for "${pitch.pitch}"`)
  }
  const roof_area_sqft = Math.round(area.footprint_sqft * mult)
  console.log(`[area] ${area.footprint_sqft} sqft × ${mult} (${pitch.pitch}) = ${roof_area_sqft} sqft`)

  const measurement = {
    slug,
    address,
    formatted_address: geo.formatted_address,
    lat: geo.lat,
    lng: geo.lng,
    pitch: pitch.pitch,
    pitch_multiplier: mult,
    pitch_confidence: pitch.confidence,
    pitch_rationale: pitch.rationale,
    pitch_stub: !!pitch.stub,
    footprint_sqft: area.footprint_sqft,
    footprint_confidence: area.confidence,
    footprint_rationale: area.rationale,
    footprint_stub: !!area.stub,
    line_items: area.line_items,
    roof_area_sqft,
    computed_at: new Date().toISOString(),
  }

  // 5. Estimate
  console.log(`\n--- Step 5/6: Estimate ---`)
  const materials = await loadMaterials()
  const estimateResult = await buildEstimate({ measurement, materials })
  for (const tier of estimateResult.tiers) {
    console.log(`[estimate] ${tier.tier_name}: $${tier.subtotal.toLocaleString()}`)
  }

  // 6. Render PDF + write outputs
  console.log(`\n--- Step 6/6: Outputs ---`)
  const outDir = join("outputs", slug)
  await mkdir(outDir, { recursive: true })

  const measurementOutPath = join(outDir, "measurement.json")
  await writeFile(measurementOutPath, JSON.stringify(measurement, null, 2))
  console.log(`[output] ${measurementOutPath}`)

  const estimateJsonPath = join(outDir, "estimate.json")
  await writeFile(estimateJsonPath, JSON.stringify(estimateResult, null, 2))
  console.log(`[output] ${estimateJsonPath}`)

  const pdfOutPath = join(outDir, "estimate.pdf")
  await renderEstimatePdf({ estimate: estimateResult, outputPath: pdfOutPath, aerialPath })

  // Copy aerial into outputs/ so the per-property bundle is self-contained
  const aerialOutPath = join(outDir, "aerial.jpg")
  await copyFile(aerialPath, aerialOutPath)
  console.log(`[output] ${aerialOutPath}`)

  // Stub flags for visibility
  if (pitch.stub || area.stub || estimateResult.stub) {
    console.log(`\n[estimate] ⚠️  Pipeline ran with stubs:`)
    if (pitch.stub) console.log(`           - pitch (task #2)`)
    if (area.stub) console.log(`           - footprint (task #3)`)
    if (estimateResult.stub) console.log(`           - estimate calc may be using fallback materials (task #5/#6)`)
  }

  console.log(`\n=========================================`)
  console.log(`[estimate] ✓ ${roof_area_sqft} sqft → ${outDir}/`)
  console.log(`=========================================\n`)

  return { slug, measurement, estimate: estimateResult }
}

run().catch((err) => {
  console.error(`\n[estimate] FAILED: ${err.message}`)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(2)
})
