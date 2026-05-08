// Pitch estimation — STUB.
// Real implementation lands as task #2 (Will).
// Until then, returns a fixed default so the rest of the pipeline can run.

export async function estimatePitch({ aerialPath, lat, lng, slug, scale }) {
  console.log(`[pitch] STUB — returning default 6:12. Real prompt comes in task #2.`)
  return {
    pitch: "6:12",
    pitch_multiplier: 1.118, // matches 6:12
    confidence: 0.0, // 0 = "this is a stub, do not trust"
    rationale: "stub default — pipeline scaffold only",
    stub: true,
  }
}

// pitch string → multiplier. Used by estimate calc.
const MULTIPLIERS = {
  "1:12": 1.003,
  "2:12": 1.014,
  "3:12": 1.031,
  "4:12": 1.054,
  "5:12": 1.083,
  "6:12": 1.118,
  "7:12": 1.158,
  "8:12": 1.202,
  "9:12": 1.250,
  "10:12": 1.302,
  "11:12": 1.357,
  "12:12": 1.414,
}

export function pitchMultiplier(pitch) {
  return MULTIPLIERS[pitch] ?? null
}
