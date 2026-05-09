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

  // 4. Compute roof_area_sqft, then apply Solar API sanity fence.
  //
  // Fence rationale (PLOG-005): on dense suburban images Claude sometimes
  // under-traces the subject roof even when correctly identified by the
  // bounding-box marker. Solar API's roofSegmentStats provides slope-
  // corrected per-segment areas — summing them gives an independent
  // estimate of total roof area that matches EagleView-style references.
  //
  // Vision-pipeline raw values are still preserved in vision-area.json
  // for auditability. measurement.json captures the final value, the
  // source ("vision" or "solar-fence"), and the fence-trigger reason.
  console.log(`\n--- Step 4/6: Roof area ---`)
  const mult = pitch.pitch_multiplier ?? pitchMultiplier(pitch.pitch)
  if (!mult) {
    throw new Error(`[area] no pitch multiplier for "${pitch.pitch}"`)
  }

  const visionFootprint = area.footprint_sqft
  const visionRoofArea = Math.round(visionFootprint * mult)
  console.log(`[area] vision: ${visionFootprint} sqft footprint × ${mult} (${pitch.pitch}) = ${visionRoofArea} sqft roof area`)

  // Try to load Solar's slope-corrected roof area for cross-check.
  // Solar exposes:
  //   - buildingStats.areaMeters2  → plan-view footprint (matches our footprint)
  //   - sum(roofSegmentStats[].stats.areaMeters2) → slope-corrected roof area (matches refs)
  // We compare vision roof area to Solar roof area (both in the same units).
  const FENCE_THRESHOLD_PCT = 12
  const insightsPath = join("intermediate", slug, "solar-insights.json")
  let solarFootprint = null
  let solarRoofArea = null
  let solarFenceTriggered = false
  let fenceReason = null
  if (await exists(insightsPath)) {
    try {
      const ins = JSON.parse(await readFile(insightsPath, "utf-8"))
      const fpM2 = ins?.solarPotential?.buildingStats?.areaMeters2
      if (fpM2) solarFootprint = Math.round(fpM2 * 10.7639)
      const segments = ins?.solarPotential?.roofSegmentStats ?? []
      let segM2 = 0
      for (const seg of segments) segM2 += seg?.stats?.areaMeters2 ?? 0
      if (segM2 > 0) solarRoofArea = Math.round(segM2 * 10.7639)
      if (solarRoofArea) {
        const deltaPct = Math.abs(visionRoofArea - solarRoofArea) / solarRoofArea * 100
        console.log(`[area] solar:  ${solarFootprint} sqft footprint, ${solarRoofArea} sqft roof area (sum of ${segments.length} segments). Vision Δ: ${deltaPct.toFixed(1)}%`)
        if (deltaPct > FENCE_THRESHOLD_PCT) {
          solarFenceTriggered = true
          fenceReason = `vision roof area ${visionRoofArea} differs from solar ${solarRoofArea} by ${deltaPct.toFixed(1)}% (>${FENCE_THRESHOLD_PCT}%)`
          console.log(`[area] ⚠ FENCE: ${fenceReason} — using solar`)
        }
      }
    } catch (err) {
      console.log(`[area] solar fence unavailable: ${err.message.slice(0, 100)}`)
    }
  }

  // If fence triggered, use Solar's slope-corrected number directly
  // (it's already roof area; no pitch multiplication).
  const roof_area_sqft = solarFenceTriggered ? solarRoofArea : visionRoofArea
  const finalFootprint = solarFenceTriggered
    ? (solarFootprint ?? Math.round(roof_area_sqft / mult))
    : visionFootprint
  if (solarFenceTriggered) {
    console.log(`[area] FINAL: ${roof_area_sqft} sqft (solar-fenced)`)
  } else {
    console.log(`[area] FINAL: ${roof_area_sqft} sqft (vision)`)
  }

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
    footprint_sqft: finalFootprint,
    footprint_confidence: area.confidence,
    footprint_rationale: area.rationale,
    footprint_stub: !!area.stub,
    line_items: area.line_items,
    roof_area_sqft,
    roof_area_source: solarFenceTriggered ? "solar-fence" : "vision",
    vision_footprint_sqft: visionFootprint,
    vision_roof_area_sqft: visionRoofArea,
    solar_footprint_sqft: solarFootprint,
    solar_roof_area_sqft: solarRoofArea,
    fence_triggered: solarFenceTriggered,
    fence_reason: fenceReason,
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
