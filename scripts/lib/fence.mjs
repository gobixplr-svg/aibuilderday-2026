// Solar API sanity fence — single source of truth.
//
// Pipeline runs vision (footprint × pitch_multiplier = vision_roof_area).
// Solar API independently exposes per-segment slope-corrected areas; summing
// them yields solar_roof_area. When the two disagree by more than
// FENCE_THRESHOLD_PCT, we trust Solar (PLOG-005, PLOG-006). Vision values
// are still preserved in vision-area.json for "build don't buy" auditability.
//
// Threshold history:
//   PLOG-005: 15% → 4/5 examples in tolerance, avg error 6.3%
//   PLOG-006: 12% → 5/5 examples in tolerance, avg error 3.4%, 0 test-set changes
//
// Used by:
//   scripts/estimate.mjs       — production pipeline
//   scripts/calibrate.mjs      — calibration runner
//   scripts/fence-sweep.mjs    — post-processing sweep tool
// Drift between these constants previously masked threshold changes in
// calibration runs (see PLOG-006).

export const FENCE_THRESHOLD_PCT = 12

// Pure function. Returns { final, fenced, deltaPct } given vision and solar
// roof areas. solarRoofArea may be null when the Solar API was unavailable
// for this address; in that case we return vision unchanged with fenced=false.
export function applyFence(visionRoofArea, solarRoofArea, thresholdPct = FENCE_THRESHOLD_PCT) {
  if (!solarRoofArea) {
    return { final: visionRoofArea, fenced: false, deltaPct: null }
  }
  const deltaPct = Math.abs(visionRoofArea - solarRoofArea) / solarRoofArea * 100
  if (deltaPct > thresholdPct) {
    return { final: solarRoofArea, fenced: true, deltaPct }
  }
  return { final: visionRoofArea, fenced: false, deltaPct }
}
