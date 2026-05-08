// Footprint + line items extraction via Claude Sonnet 4.x vision.
// Input: aerial JPEG + feet/pixel scale.
// Output: { footprint_sqft, line_items, confidence, rationale }
//
// line_items.eave drives drip edge cost; line_items.ridge + line_items.hip
// drive ridge cap cost in scripts/lib/estimate.mjs.

import { dirname, join } from "path"
import { access } from "fs/promises"
import { runVisionCall } from "./claude.mjs"
import { annotateAerial } from "./scale-bar.mjs"

const FOOTPRINT_TOOL = {
  name: "report_footprint",
  description: "Report the residential roof footprint area and the linear feet of each roof edge type.",
  input_schema: {
    type: "object",
    required: ["footprint_sqft", "line_items", "confidence", "rationale"],
    properties: {
      footprint_sqft: {
        type: "number",
        description: "Roof footprint (plan-view) area in square feet. Not slope-corrected.",
      },
      line_items: {
        type: "object",
        required: ["ridge", "hip", "valley", "rake", "eave"],
        properties: {
          ridge: { type: "number", description: "Total linear feet of ridge lines (horizontal peaks where two slopes meet at the top)." },
          hip: { type: "number", description: "Total linear feet of hip lines (sloped edges from peak to corner)." },
          valley: { type: "number", description: "Total linear feet of valley lines (inward angles where two slopes meet, often visible as darker lines)." },
          rake: { type: "number", description: "Total linear feet of rake lines (sloped gable edges)." },
          eave: { type: "number", description: "Total linear feet of eave lines (horizontal lower edges where gutters typically attach)." },
        },
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence in the footprint estimate (0-1).",
      },
      rationale: {
        type: "string",
        description: "How you traced the outline, what bounding-box you used, and any cutouts/bumps you adjusted for.",
      },
    },
  },
}

const FOOTPRINT_SYSTEM_PROMPT_TEMPLATE = (feetPerPixel) => `You are measuring the roof of a residential home from a satellite image.

INPUT:
- Image: a north-up Google Static Maps satellite image, 1280x1280 px.
- Scale: each pixel represents ${feetPerPixel.toFixed(4)} feet on the ground. A 50-ft scale bar is overlaid in the bottom-left for reference; a north arrow is in the top-right.

GOAL: Report (1) the roof footprint in square feet (plan-view area, NOT slope-corrected — slope correction happens elsewhere), and (2) the linear-foot length of each roof edge type.

DEFINITIONS:
- Ridge: a horizontal peak where two roof slopes meet at the top.
- Hip: a sloped edge running from a peak down to a corner where two slopes meet (common on hip roofs).
- Valley: an inward angle where two slopes meet, usually visible as a darker line.
- Rake: a sloped gable edge (the angled edge of a gable end).
- Eave: a horizontal lower edge (where gutters attach).

METHOD:
1. Identify the residential roof. Ignore detached structures (sheds, garages disconnected from the main house) unless clearly attached.
2. Trace the outline of the roof in your reasoning. Estimate the bounding rectangle in pixels, then refine for cutouts and bumps.
3. Convert pixel area to square feet using the scale: 1 px = ${feetPerPixel.toFixed(4)} ft, so 1 sq px = ${(feetPerPixel * feetPerPixel).toFixed(6)} sq ft.
4. For each line-item type, identify all instances on the roof, estimate each in pixels, sum, then convert to feet.
5. Sanity-check: typical US residential roof footprints are 1,500-4,000 sqft. Eaves typically equal a large fraction of the perimeter. If your number is wildly outside that range, recheck your scale math before committing.

PROCESS: Reason step by step. Then call the report_footprint tool with your final values and a 0-1 confidence.`

export async function estimateFootprint({ aerialPath, lat, lng, slug, scale }) {
  const annotatedPath = join(dirname(aerialPath), "aerial-annotated.jpg")
  if (!(await fileExists(annotatedPath))) {
    console.log(`[footprint] annotating aerial with scale bar`)
    await annotateAerial({ inputPath: aerialPath, outputPath: annotatedPath, feetPerPixel: scale })
  }

  console.log(`[footprint] calling Claude Sonnet 4.x`)
  const { input, usage } = await runVisionCall({
    systemPrompt: FOOTPRINT_SYSTEM_PROMPT_TEMPLATE(scale),
    userText: `Analyze this satellite image of ${slug}. Lat/lng: ${lat.toFixed(4)}, ${lng.toFixed(4)}.`,
    imagePath: annotatedPath,
    tool: FOOTPRINT_TOOL,
  })

  console.log(
    `[footprint] usage: in=${usage.input_tokens} cache_read=${usage.cache_read_input_tokens ?? 0} cache_create=${usage.cache_creation_input_tokens ?? 0} out=${usage.output_tokens}`,
  )

  return {
    footprint_sqft: input.footprint_sqft,
    line_items: input.line_items,
    confidence: input.confidence,
    rationale: input.rationale,
  }
}

async function fileExists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}
