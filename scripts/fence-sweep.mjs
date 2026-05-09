#!/usr/bin/env node
// scripts/fence-sweep.mjs
//
// Sweep the Solar fence threshold across cached vision + Solar data for the
// 5 example + 5 test properties. Pure post-processing — no Claude / Solar /
// Maps API calls. Reads:
//   intermediate/<slug>/vision-area.json
//   intermediate/<slug>/vision-pitch.json
//   intermediate/<slug>/solar-insights.json
//
// Mirrors the fence math in scripts/estimate.mjs (lines ~124-170).
// Prints a per-threshold table for examples (with reference deltas) and
// test set (no references). Helps decide whether to keep 15% or move it.
//
// Usage: node scripts/fence-sweep.mjs

import { readFile, access } from "fs/promises"
import { join } from "path"
import { pitchMultiplier } from "./lib/pitch.mjs"
import { applyFence } from "./lib/fence.mjs"

const THRESHOLDS = [10, 12, 15, 18, 20]

// Slug → reference average. From benchmarks/example-properties.md.
const EXAMPLES = [
  { slug: "21106-kenswick-meadows-ct-humble-tx-77338",   label: "Kenswick TX",     refAvg: 2393, refPitch: "6:12" },
  { slug: "5914-copper-lilly-lane-spring-tx-77389",      label: "Copper Lily TX",  refAvg: 4344, refPitch: "8:12" },
  { slug: "122-nw-13th-ave-cape-coral-fl-33993",         label: "Cape Coral FL",   refAvg: 2884, refPitch: "6:12" },
  { slug: "14132-trenton-ave-orland-park-il-60462",      label: "Orland Park IL",  refAvg: 2963, refPitch: "4:12" },
  { slug: "835-s-cobble-creek-nixa-mo-65714",            label: "Nixa MO",         refAvg: 3044, refPitch: "8:12" },
]

const TEST = [
  { slug: "3561-e-102nd-ct-thornton-co-80229",       label: "Thornton CO" },
  { slug: "1612-s-canton-ave-springfield-mo-65802",  label: "Canton MO" },
  { slug: "6310-laguna-bay-court-houston-tx-77041",  label: "Houston TX" },
  { slug: "3820-e-rosebrier-st-springfield-mo-65809", label: "Rosebrier MO" },
  { slug: "1261-20th-street-newport-news-va-23607",  label: "Newport News VA" },
]

async function exists(p) {
  try { await access(p); return true } catch { return false }
}

async function loadProperty(slug) {
  const dir = join("intermediate", slug)
  const pitchPath = join(dir, "vision-pitch.json")
  const areaPath = join(dir, "vision-area.json")
  const insightsPath = join(dir, "solar-insights.json")

  if (!(await exists(pitchPath)) || !(await exists(areaPath))) {
    return { error: "missing vision cache" }
  }

  const pitch = JSON.parse(await readFile(pitchPath, "utf-8"))
  const area = JSON.parse(await readFile(areaPath, "utf-8"))
  const mult = pitch.pitch_multiplier ?? pitchMultiplier(pitch.pitch)
  if (!mult) return { error: `bad pitch ${pitch.pitch}` }

  const visionRoofArea = Math.round(area.footprint_sqft * mult)

  let solarRoofArea = null
  if (await exists(insightsPath)) {
    try {
      const ins = JSON.parse(await readFile(insightsPath, "utf-8"))
      const segments = ins?.solarPotential?.roofSegmentStats ?? []
      let segM2 = 0
      for (const seg of segments) segM2 += seg?.stats?.areaMeters2 ?? 0
      if (segM2 > 0) solarRoofArea = Math.round(segM2 * 10.7639)
    } catch {}
  }

  return {
    pitch: pitch.pitch,
    visionRoofArea,
    solarRoofArea,
    deltaPct: solarRoofArea
      ? Math.abs(visionRoofArea - solarRoofArea) / solarRoofArea * 100
      : null,
  }
}

function applyFenceAtThreshold(prop, thresholdPct) {
  return applyFence(prop.visionRoofArea, prop.solarRoofArea, thresholdPct)
}

function pad(s, n) { return String(s).padEnd(n) }
function rpad(s, n) { return String(s).padStart(n) }

async function main() {
  // Load all
  const examples = []
  for (const e of EXAMPLES) {
    examples.push({ ...e, ...(await loadProperty(e.slug)) })
  }
  const tests = []
  for (const t of TEST) {
    tests.push({ ...t, ...(await loadProperty(t.slug)) })
  }

  // Per-property header line: vision / solar / Δ% — same regardless of threshold.
  console.log("\n=== Cached vision vs Solar (input to fence) ===\n")
  console.log(pad("Property", 22), rpad("Vision", 8), rpad("Solar", 8), rpad("Δ%", 7), rpad("Pitch", 6))
  console.log("-".repeat(60))
  for (const p of [...examples, ...tests]) {
    if (p.error) { console.log(pad(p.label, 22), p.error); continue }
    console.log(
      pad(p.label, 22),
      rpad(p.visionRoofArea, 8),
      rpad(p.solarRoofArea ?? "—", 8),
      rpad(p.deltaPct?.toFixed(1) ?? "—", 7),
      rpad(p.pitch, 6),
    )
  }

  // Examples — sweep
  console.log("\n=== Examples: final sqft and Δ% vs reference, by threshold ===\n")
  const header = [pad("Property", 22), rpad("Ref", 6)]
  for (const t of THRESHOLDS) header.push(rpad(`${t}%`, 13))
  console.log(header.join(" "))
  console.log("-".repeat(22 + 1 + 6 + (1 + 13) * THRESHOLDS.length))

  const tally = Object.fromEntries(THRESHOLDS.map((t) => [t, { hits: 0, totalAbsDelta: 0, fences: 0 }]))

  for (const e of examples) {
    if (e.error) continue
    const row = [pad(e.label, 22), rpad(e.refAvg, 6)]
    for (const t of THRESHOLDS) {
      const { final, fenced } = applyFenceAtThreshold(e, t)
      const deltaPct = (final - e.refAvg) / e.refAvg * 100
      const inTol = Math.abs(deltaPct) <= 10
      if (inTol) tally[t].hits++
      if (fenced) tally[t].fences++
      tally[t].totalAbsDelta += Math.abs(deltaPct)
      const mark = inTol ? "✓" : "✗"
      const tag = fenced ? "S" : "V"
      row.push(rpad(`${final} ${mark}${tag}${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`, 13))
    }
    console.log(row.join(" "))
  }

  console.log("-".repeat(22 + 1 + 6 + (1 + 13) * THRESHOLDS.length))
  const sumRow1 = [pad("HITS / 5", 22), rpad("", 6)]
  const sumRow2 = [pad("AVG |Δ%|", 22), rpad("", 6)]
  const sumRow3 = [pad("FENCES", 22), rpad("", 6)]
  for (const t of THRESHOLDS) {
    sumRow1.push(rpad(`${tally[t].hits}/5`, 13))
    sumRow2.push(rpad(`${(tally[t].totalAbsDelta / 5).toFixed(2)}%`, 13))
    sumRow3.push(rpad(`${tally[t].fences}`, 13))
  }
  console.log(sumRow1.join(" "))
  console.log(sumRow2.join(" "))
  console.log(sumRow3.join(" "))

  // Test set — no references, just show what gets submitted at each threshold
  console.log("\n=== Test set: submission sqft by threshold ===\n")
  const tHeader = [pad("Property", 22)]
  for (const t of THRESHOLDS) tHeader.push(rpad(`${t}%`, 13))
  console.log(tHeader.join(" "))
  console.log("-".repeat(22 + (1 + 13) * THRESHOLDS.length))

  for (const tp of tests) {
    if (tp.error) continue
    const row = [pad(tp.label, 22)]
    for (const t of THRESHOLDS) {
      const { final, fenced } = applyFenceAtThreshold(tp, t)
      const tag = fenced ? "S" : "V"
      row.push(rpad(`${final} ${tag}`, 13))
    }
    console.log(row.join(" "))
  }

  console.log("\nLegend: V = vision, S = solar-fenced. ✓ = within ±10% of reference avg.\n")
}

main().catch((e) => { console.error(e); process.exit(1) })
