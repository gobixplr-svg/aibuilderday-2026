// Footprint + line items extraction — STUB.
// Real implementation lands as task #3 (Will).
// Until then, returns a placeholder shape so #4 (calibration) and #8
// (CLI orchestrator) can run end-to-end.

export async function estimateFootprint({ aerialPath, lat, lng, slug, scale }) {
  console.log(`[footprint] STUB — returning placeholder. Real prompt comes in task #3.`)
  return {
    footprint_sqft: 2000,
    line_items: {
      ridge: 0,
      hip: 0,
      valley: 0,
      rake: 0,
      eave: 0,
    },
    confidence: 0.0,
    rationale: "stub default — pipeline scaffold only",
    stub: true,
  }
}
