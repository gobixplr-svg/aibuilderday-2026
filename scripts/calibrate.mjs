#!/usr/bin/env node
// scripts/calibrate.mjs
//
// Run the full estimate pipeline against the 5 example properties and
// compare predictions to the EagleView/Geospan reference data from the
// bounty repo. Prints a deviation table and a summary verdict.
//
// Reference data is hard-coded here from benchmarks/example-properties.md
// for fast iteration. Test properties have NO reference and are not
// included; submission for those is via scripts/run-test-set.mjs (later).
//
// Usage:
//   node scripts/calibrate.mjs              (uses cached pipeline output)
//   node scripts/calibrate.mjs --no-cache   (forces re-run)
//   node scripts/calibrate.mjs --pitch-only (only check pitch accuracy)
//
// Exit codes:
//   0 = all properties within tolerance
//   1 = bad usage
//   2 = pipeline error on at least one property
//   3 = pipeline ran, but at least one property outside ±10% tolerance

import "./lib/env.mjs"
import { mkdir, writeFile, readFile, copyFile, access } from "fs/promises"
import { join } from "path"
import { fetchAerialPipeline } from "./lib/aerial-pipeline.mjs"
import { estimatePitch, pitchMultiplier } from "./lib/pitch.mjs"
import { estimateFootprint } from "./lib/footprint.mjs"
import { loadMaterials, buildEstimate } from "./lib/estimate.mjs"
import { slugify } from "./lib/slug.mjs"

const TOLERANCE_PCT = 10 // ±10% target

const REFERENCES = [
  {
    address: "21106 Kenswick Meadows Ct, Humble, TX 77338",
    ref_a: { sqft: 2443, pitch: "6:12" },
    ref_b: { sqft: 2343, pitch: "6:12" },
  },
  {
    address: "5914 Copper Lilly Lane, Spring, TX 77389",
    ref_a: { sqft: 4391, pitch: "8:12" },
    ref_b: { sqft: 4296, pitch: "8:12" },
  },
  {
    address: "122 NW 13th Ave, Cape Coral, FL 33993",
    ref_a: { sqft: 2917, pitch: "6:12" },
    ref_b: { sqft: 2851, pitch: "6:12" },
  },
  {
    address: "14132 Trenton Ave, Orland Park, IL 60462",
    ref_a: { sqft: 2990, pitch: "4:12" },
    ref_b: { sqft: 2935, pitch: "4:12" },
  },
  {
    address: "835 S Cobble Creek, Nixa, MO 65714",
    ref_a: { sqft: 3070, pitch: "8:12" },
    ref_b: { sqft: 3017, pitch: "8:12" },
  },
]

const args = process.argv.slice(2)
const noCache = args.includes("--no-cache")
const pitchOnly = args.includes("--pitch-only")

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

// Run pipeline up to and including roof_area_sqft. Skips estimate + PDF
// for speed; we're only measuring accuracy here.
async function predict(address) {
  const { slug, dir, geo, meta, aerialPath } = await fetchAerialPipeline({ address, noCache })

  const pitchPath = join(dir, "vision-pitch.json")
  let pitch
  if (!noCache && (await exists(pitchPath))) {
    pitch = JSON.parse(await readFile(pitchPath, "utf-8"))
  } else {
    pitch = await estimatePitch({ aerialPath, lat: geo.lat, lng: geo.lng, slug, scale: meta.feet_per_pixel })
    await writeFile(pitchPath, JSON.stringify(pitch, null, 2))
  }

  const areaPath = join(dir, "vision-area.json")
  let area
  if (!noCache && (await exists(areaPath))) {
    area = JSON.parse(await readFile(areaPath, "utf-8"))
  } else {
    area = await estimateFootprint({ aerialPath, lat: geo.lat, lng: geo.lng, slug, scale: meta.feet_per_pixel })
    await writeFile(areaPath, JSON.stringify(area, null, 2))
  }

  const mult = pitch.pitch_multiplier ?? pitchMultiplier(pitch.pitch)
  if (!mult) {
    throw new Error(`no pitch multiplier for "${pitch.pitch}"`)
  }
  const visionRoofArea = Math.round(area.footprint_sqft * mult)

  // Apply Solar API fence — mirror the production logic in scripts/estimate.mjs
  // so calibration numbers reflect what would actually be submitted.
  const FENCE_THRESHOLD_PCT = 12
  const insightsPath = join(dir, "solar-insights.json")
  let solarRoofArea = null
  let fenceTriggered = false
  if (await exists(insightsPath)) {
    try {
      const ins = JSON.parse(await readFile(insightsPath, "utf-8"))
      const segments = ins?.solarPotential?.roofSegmentStats ?? []
      let segM2 = 0
      for (const seg of segments) segM2 += seg?.stats?.areaMeters2 ?? 0
      if (segM2 > 0) solarRoofArea = Math.round(segM2 * 10.7639)
      if (solarRoofArea) {
        const deltaPct = Math.abs(visionRoofArea - solarRoofArea) / solarRoofArea * 100
        if (deltaPct > FENCE_THRESHOLD_PCT) fenceTriggered = true
      }
    } catch {}
  }
  const roof_area_sqft = fenceTriggered ? solarRoofArea : visionRoofArea

  return { slug, pitch, area, visionRoofArea, solarRoofArea, fenceTriggered, roof_area_sqft, stub: !!(pitch.stub || area.stub) }
}

function pct(predicted, target) {
  return ((predicted - target) / target) * 100
}

function fmtPct(n) {
  const sign = n >= 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

async function run() {
  console.log(`\n=========================================`)
  console.log(`[calibrate] ${REFERENCES.length} example properties`)
  console.log(`[calibrate] tolerance: ±${TOLERANCE_PCT}% from reference average`)
  console.log(`=========================================\n`)

  const results = []
  let pipelineErrors = 0
  let stubsSeen = false

  for (const ref of REFERENCES) {
    console.log(`\n--- ${ref.address} ---`)
    try {
      const pred = await predict(ref.address)
      stubsSeen ||= pred.stub
      const refAvg = (ref.ref_a.sqft + ref.ref_b.sqft) / 2
      const deviation = pct(pred.roof_area_sqft, refAvg)
      const inEnvelope = pred.roof_area_sqft >= Math.min(ref.ref_a.sqft, ref.ref_b.sqft) &&
                         pred.roof_area_sqft <= Math.max(ref.ref_a.sqft, ref.ref_b.sqft)
      const inTolerance = Math.abs(deviation) <= TOLERANCE_PCT
      const pitchHit = pred.pitch.pitch === ref.ref_a.pitch
      results.push({ ref, pred, refAvg, deviation, inEnvelope, inTolerance, pitchHit })
      const sourceTag = pred.fenceTriggered ? " [SOLAR-FENCED]" : pred.solarRoofArea ? " [vision]" : ""
      console.log(`  predicted: ${pred.roof_area_sqft} sqft, ${pred.pitch.pitch}${pred.stub ? " [STUB]" : ""}${sourceTag}`)
      if (pred.solarRoofArea && !pred.fenceTriggered) {
        console.log(`  (vision: ${pred.visionRoofArea}, solar: ${pred.solarRoofArea}, Δ ${(Math.abs(pred.visionRoofArea - pred.solarRoofArea) / pred.solarRoofArea * 100).toFixed(1)}% — fence not triggered)`)
      }
      console.log(`  ref avg:   ${refAvg.toFixed(0)} sqft (A: ${ref.ref_a.sqft}, B: ${ref.ref_b.sqft})`)
      console.log(`  delta:     ${fmtPct(deviation)} ${inTolerance ? "✓" : "✗"}`)
      console.log(`  pitch:     ${ref.ref_a.pitch} ${pitchHit ? "✓" : "✗"}`)
    } catch (err) {
      console.error(`  ERROR: ${err.message}`)
      pipelineErrors++
      results.push({ ref, error: err.message })
    }
  }

  // Summary table
  console.log(`\n=========================================`)
  console.log(`Summary`)
  console.log(`=========================================`)
  const header = "Property".padEnd(45) + "Pred".padStart(7) + "Ref".padStart(8) + "Δ%".padStart(9) + "Pitch".padStart(8)
  console.log(header)
  console.log("-".repeat(header.length))
  for (const r of results) {
    if (r.error) {
      console.log(r.ref.address.slice(0, 42).padEnd(45) + "ERROR".padStart(32))
      continue
    }
    const cell = r.ref.address.slice(0, 42).padEnd(45) +
      String(r.pred.roof_area_sqft).padStart(7) +
      String(r.refAvg.toFixed(0)).padStart(8) +
      fmtPct(r.deviation).padStart(9) +
      `${r.pred.pitch.pitch}${r.pitchHit ? "✓" : "✗"}`.padStart(8)
    console.log(cell)
  }

  const ok = results.filter((r) => !r.error)
  const passed = ok.filter((r) => r.inTolerance).length
  const pitchPassed = ok.filter((r) => r.pitchHit).length
  console.log(`\n${passed}/${ok.length} within ±${TOLERANCE_PCT}%   ${pitchPassed}/${ok.length} pitch correct`)
  if (stubsSeen) {
    console.log(`⚠️  Stubs in pipeline — these numbers are not yet meaningful.`)
    console.log(`   Real prompts land in tasks #2 and #3.`)
  }

  if (pipelineErrors > 0) process.exit(2)
  if (passed < ok.length) process.exit(3)
  console.log(`\n✓ all properties in tolerance`)
}

run().catch((err) => {
  console.error(`\n[calibrate] FAILED: ${err.message}`)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(2)
})
