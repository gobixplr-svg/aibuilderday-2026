// Pitch estimation via Claude Sonnet 4.x vision.
// Input: aerial JPEG + feet/pixel scale.
// Output: { pitch, pitch_multiplier, confidence, rationale }

import { dirname, join } from "path"
import { access } from "fs/promises"
import { runVisionCall } from "./claude.mjs"
import { annotateAerial } from "./scale-bar.mjs"

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

const PITCH_TOOL = {
  name: "report_pitch",
  description: "Report the dominant roof pitch of the residential home in the image.",
  input_schema: {
    type: "object",
    required: ["pitch", "confidence", "rationale"],
    properties: {
      pitch: {
        type: "string",
        enum: ["3:12", "4:12", "5:12", "6:12", "7:12", "8:12", "9:12", "10:12", "12:12"],
        description: "Dominant roof pitch in rise:run notation.",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence in the pitch estimate (0-1).",
      },
      rationale: {
        type: "string",
        description: "Visual cues used: shadow length, roof prominence, eave-overhang patterns, dormer/peak protrusion, etc.",
      },
    },
  },
}

const PITCH_SYSTEM_PROMPT = `You are estimating the roof pitch of a residential home from a satellite image.

INPUT: A north-up satellite image of a residential property. The roof is typically the largest contiguous structure. A 50-foot scale bar is overlaid in the bottom-left for reference; a north arrow is in the top-right.

PITCH BACKGROUND: Pitch is rise:run. 4:12 is shallow, 8:12 is steep, 12:12 is 45°. Most US residential roofs are 4:12-8:12. Tile and southern Florida tend lower (4:12-6:12); steep northern climates and architectural homes tend higher (7:12-10:12).

VISUAL CUES (use multiple, not just one):
1. Shadow length on the ground from the eave: longer shadow relative to building width = steeper roof.
2. Visible elevation cues: dormers, peaks, gables that protrude prominently in plan view suggest a steeper pitch.
3. Roof-to-eave ratio: on steep roofs, the visible ridge is much narrower than the eave footprint. On shallow roofs, the ridge sits closer to the building footprint outline.
4. Roof texture: shingle visibility and shadow definition can hint at slope.

If shadows are absent (overcast image, midday), rely on roof-to-eave geometry and the prevalence of pitched/dormered features.

PROCESS: Reason step by step. Then call the report_pitch tool with one pitch from the enum, a 0-1 confidence, and a one-paragraph rationale citing the specific visual cues you used.`

export async function estimatePitch({ aerialPath, lat, lng, slug, scale }) {
  const annotatedPath = join(dirname(aerialPath), "aerial-annotated.jpg")
  if (!(await fileExists(annotatedPath))) {
    console.log(`[pitch] annotating aerial with scale bar`)
    await annotateAerial({ inputPath: aerialPath, outputPath: annotatedPath, feetPerPixel: scale })
  }

  console.log(`[pitch] calling Claude Sonnet 4.x`)
  const { input, usage } = await runVisionCall({
    systemPrompt: PITCH_SYSTEM_PROMPT,
    userText: `Analyze this satellite image of ${slug}. Lat/lng: ${lat.toFixed(4)}, ${lng.toFixed(4)}. Image scale: 1 pixel = ${scale.toFixed(3)} feet.`,
    imagePath: annotatedPath,
    tool: PITCH_TOOL,
  })

  const mult = pitchMultiplier(input.pitch)
  if (!mult) {
    throw new Error(`[pitch] model returned invalid pitch "${input.pitch}"`)
  }

  console.log(
    `[pitch] usage: in=${usage.input_tokens} cache_read=${usage.cache_read_input_tokens ?? 0} cache_create=${usage.cache_creation_input_tokens ?? 0} out=${usage.output_tokens}`,
  )

  return {
    pitch: input.pitch,
    pitch_multiplier: mult,
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
