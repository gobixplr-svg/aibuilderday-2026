// Solar API roof pitch — area-weighted from cached buildingInsights response.
//
// Google's Solar API (buildingInsights.findClosest) returns roofSegmentStats[],
// where each segment has pitchDegrees as a decimal-degree slope. The Satellite
// Sunroof paper (NeurIPS 2024, arXiv 2408.14400) reports ~5° pitch MAE under
// RGB+DSM coverage — roughly one 1:12 enum bucket. That's substantially better
// than what a single overhead Claude vision call achieves on the same image
// (PLOG-001/PLOG-007 history: pitch was the weakest leg of the pipeline).
//
// We area-weight by stats.areaMeters2 across all segments returned for the
// subject building, then bucket to the nearest x:12 enum. Output shape mirrors
// estimatePitch() so it's a drop-in primary; vision pitch becomes the fallback
// when Solar coverage is missing or imageryQuality is LOW.
//
// Conversion: pitch_x_in_12 = round(12 * tan(pitchDegrees * pi/180))
// Reference: 4:12=18.43°, 5:12=22.62°, 6:12=26.57°, 8:12=33.69°, 10:12=39.81°.

import { readFile, access } from "fs/promises"
import { pitchMultiplier } from "./pitch.mjs"

const PITCH_ENUM = ["3:12", "4:12", "5:12", "6:12", "7:12", "8:12", "9:12", "10:12", "11:12", "12:12"]

function bucketEnum(degrees) {
  const x = Math.round(12 * Math.tan((degrees * Math.PI) / 180))
  // Clamp to enum range to avoid pathological values from bad Solar data.
  const clamped = Math.max(3, Math.min(12, x))
  return `${clamped}:12`
}

async function fileExists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

// Read a cached Solar insights JSON and return our pitch shape, OR null if the
// data is unavailable / unusable. Pure(ish): only does fs reads, no API calls.
//
// Returns null when:
//   - the cache file doesn't exist
//   - imageryQuality is LOW (Google's own signal that the underlying DSM is
//     single-view RGB-only and the ~5° MAE claim doesn't apply)
//   - roofSegmentStats is empty or all-zero-area
//
// Caller decides whether to fall back to vision pitch.
export async function solarPitch({ insightsPath }) {
  if (!(await fileExists(insightsPath))) return null

  let data
  try {
    data = JSON.parse(await readFile(insightsPath, "utf-8"))
  } catch {
    return null
  }

  const quality = data?.imageryQuality
  if (quality === "LOW") return null

  const segs = data?.solarPotential?.roofSegmentStats ?? []
  if (segs.length === 0) return null

  let totalArea = 0
  let weightedSum = 0
  for (const seg of segs) {
    const a = seg?.stats?.areaMeters2
    const p = seg?.pitchDegrees
    if (typeof a === "number" && typeof p === "number" && a > 0) {
      totalArea += a
      weightedSum += p * a
    }
  }
  if (totalArea === 0) return null

  const avgDeg = weightedSum / totalArea
  const pitch = bucketEnum(avgDeg)
  const mult = pitchMultiplier(pitch)
  if (!mult) return null

  // Confidence proxy: HIGH imagery and many segments → high confidence;
  // MEDIUM imagery or sparse segments → moderate. This is a deterministic
  // heuristic, not a calibrated probability — it exists so the downstream
  // PDF can show a "pitch confidence" badge without us claiming false rigor.
  const baseConf = quality === "HIGH" ? 0.85 : quality === "MEDIUM" ? 0.70 : 0.55
  const segBonus = segs.length >= 4 ? 0.05 : 0
  const confidence = Math.min(0.95, baseConf + segBonus)

  return {
    pitch,
    pitch_multiplier: mult,
    confidence,
    rationale: `Area-weighted across ${segs.length} roof segments from Google Solar API (imageryQuality=${quality}): ${avgDeg.toFixed(2)}° → ${pitch}. Solar's underlying DSM model reports ~5° MAE in published benchmarks (Satellite Sunroof, NeurIPS 2024).`,
    avg_degrees: avgDeg,
    segment_count: segs.length,
    imagery_quality: quality,
    source: "solar",
  }
}
