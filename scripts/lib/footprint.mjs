// Footprint + line items extraction via Claude Sonnet 4.x vision.
// Input: aerial JPEG + feet/pixel scale.
// Output: { footprint_sqft, line_items, confidence, rationale }
//
// line_items.eave drives drip edge cost; line_items.ridge + line_items.hip
// drive ridge cap cost in scripts/lib/estimate.mjs.

import { dirname, join } from "path"
import { access, readFile, writeFile } from "fs/promises"
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

const FOOTPRINT_SYSTEM_PROMPT_TEMPLATE = (feetPerPixel, hasSubjectMarker) => `You are measuring the roof of a residential home from a satellite image.

INPUT:
- Image: a north-up satellite image of a residential property.
- Scale: each pixel represents ${feetPerPixel.toFixed(4)} feet on the ground. A 50-ft scale bar is overlaid in the bottom-left for reference; a north arrow is in the top-right.${hasSubjectMarker ? `
- SUBJECT IDENTIFICATION: An orange dashed bounding box and an orange reticle mark THE subject home. The "SUBJECT" label is in the top-left of the box. Measure ONLY the roof inside (or extending slightly beyond) the orange box. Ignore all other buildings in the image.` : ""}

GOAL: Report (1) the roof footprint in square feet (plan-view area, NOT slope-corrected — slope correction happens elsewhere), and (2) the linear-foot length of each roof edge type.

DEFINITIONS:
- Ridge: a horizontal peak where two roof slopes meet at the top.
- Hip: a sloped edge running from a peak down to a corner where two slopes meet (common on hip roofs).
- Valley: an inward angle where two slopes meet, usually visible as a darker line.
- Rake: a sloped gable edge (the angled edge of a gable end).
- Eave: a horizontal lower edge (where gutters attach).

WHAT COUNTS AS "THE ROOF":
- The subject home's main roof PLUS attached garage, additions, sunrooms, covered porches.
- Two structures count as attached if their roof edges meet with no visible ground/driveway/grass between them.
- Truly separated structures (across a yard, across a drive) are NOT included.

METHOD:
1. ${hasSubjectMarker ? "Use the orange bounding box and reticle to identify the subject home." : "Identify the subject home (most centered, largest contiguous structure)."} Then trace the outline of its roof, including any attached garage/addition/porch.
2. Estimate the trace as a polygon. For complex hip roofs viewed from above, the roof footprint typically fills 80-90% of its bounding rectangle (don't apply an aggressive fill-factor reduction — hip roofs are densely filled when viewed in plan).
3. Convert pixel area to square feet using the scale: 1 px = ${feetPerPixel.toFixed(4)} ft, so 1 sq px = ${(feetPerPixel * feetPerPixel).toFixed(6)} sq ft.
4. For each line-item type, identify all instances on the subject roof, estimate each in pixels, sum, then convert to feet.
5. Sanity-check: US residential roof footprints (including attached garages) commonly range 1,500-5,500 sqft. Custom/luxury homes reach 6,000+. The bounding-box × fill-factor estimate should agree with your direct polygon estimate within ~15%; if not, re-check.

PROCESS: Reason step by step. Then call the report_footprint tool with your final values and a 0-1 confidence.`

export async function estimateFootprint({ aerialPath, lat, lng, slug, scale }) {
  // Try Solar API for subject disambiguation. If it works, draw a
  // bounding-box + reticle overlay so Claude knows exactly which house
  // to measure. If it doesn't (API disabled, no data for this address),
  // fall back to scale-bar-only annotation.
  const annotatedPath = join(dirname(aerialPath), "aerial-annotated.jpg")
  const insightsPath = join(dirname(aerialPath), "solar-insights.json")

  let buildingInsights = null
  if (await fileExists(insightsPath)) {
    try {
      const txt = await readFile(insightsPath, "utf-8")
      buildingInsights = JSON.parse(txt)
      console.log(`[footprint] solar insights cache hit`)
    } catch (err) {
      // Cache file exists but is unreadable/corrupt (truncated write, manual edit).
      // Don't silently fall through — that would disable the Solar fence without
      // any warning and silently change the submission number. Refetch instead.
      console.warn(`[footprint] solar insights cache corrupt (${err.message.slice(0, 80)}); refetching`)
    }
  }
  if (!buildingInsights) {
    try {
      const { getBuildingInsights } = await import("./solar-api.mjs")
      buildingInsights = await getBuildingInsights({ lat, lng })
      await writeFile(insightsPath, JSON.stringify(buildingInsights, null, 2))
      console.log(`[footprint] solar insights fetched (subject disambiguation enabled)`)
    } catch (err) {
      // Solar API is genuinely unavailable for this address (no coverage,
      // 404 even at LOW quality, API key disabled). This is a legitimate
      // fallback path — pipeline still produces a measurement, just without
      // subject disambiguation or the fence sanity check.
      console.log(`[footprint] solar insights unavailable (${err.message.slice(0, 80)}); falling back to scale-bar only`)
    }
  }

  console.log(`[footprint] annotating aerial${buildingInsights ? " with subject marker" : ""}`)
  await annotateAerial({
    inputPath: aerialPath,
    outputPath: annotatedPath,
    feetPerPixel: scale,
    centerLat: lat,
    centerLng: lng,
    buildingInsights,
  })

  console.log(`[footprint] calling Claude Sonnet 4.x`)
  const { input, usage } = await runVisionCall({
    systemPrompt: FOOTPRINT_SYSTEM_PROMPT_TEMPLATE(scale, !!buildingInsights),
    userText: `Analyze this satellite image of ${slug}. Lat/lng: ${lat.toFixed(4)}, ${lng.toFixed(4)}.${buildingInsights ? " The subject home is highlighted with the orange bounding box and reticle." : ""}`,
    imagePath: annotatedPath,
    tool: FOOTPRINT_TOOL,
    maxTokens: 16384,
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
