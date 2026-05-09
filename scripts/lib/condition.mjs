// Roof condition assessment via Claude Sonnet 4.x vision.
// Input: annotated aerial JPEG (with the orange SUBJECT box already drawn
// by footprint.mjs's annotateAerial call).
// Output: { overall_condition, findings, rationale }
//
// This is a third parallel vision call alongside pitch + footprint. Runs
// against the SAME annotated aerial those calls use — no need to re-fetch
// or re-annotate. Adds ~15-40s wall clock per property and ~$0.03 in API
// spend.
//
// Framing: "pre-inspection observations" / "AI vision condition assessment"
// — NOT "damage detection." This is for an instant-quote tool that will
// follow up with an in-person inspection. Per CLAUDE.md hard rule #2,
// the prompt makes "no findings" the path of least resistance to prevent
// fabrication. Empty findings array IS the correct output when nothing
// notable is visible.
//
// Methodology + spike calibration documented in PLOG-008.

import { runVisionCall } from "./claude.mjs"

const CONDITION_TOOL = {
  name: "report_roof_condition",
  description: "Report visible roof condition findings on the subject home in the orange bounding box, OR explicitly report no visible issues.",
  input_schema: {
    type: "object",
    required: ["overall_condition", "findings", "rationale"],
    properties: {
      overall_condition: {
        type: "string",
        enum: ["good", "fair", "concerning", "unable_to_assess"],
        description: "Overall visible roof condition. 'good' = no notable issues. 'fair' = minor visible issues but not urgent. 'concerning' = visible damage, missing material, structural concerns, or active deterioration. 'unable_to_assess' = image quality, tree cover, shadows, or angle prevents reliable assessment.",
      },
      findings: {
        type: "array",
        description: "List of SPECIFIC visible findings on the subject roof. EMPTY ARRAY is the correct answer when no visible issues are present. Do NOT speculate. Each finding must cite a directly visible cue (color variation, missing material, foreign object, etc.). Max 5 findings.",
        items: {
          type: "object",
          required: ["category", "description", "location_description", "severity", "confidence"],
          properties: {
            category: {
              type: "string",
              enum: ["missing_shingles", "patching_repair", "moss_or_growth", "tarp_or_covering", "structural_sag", "discoloration_staining", "debris", "other"],
            },
            description: {
              type: "string",
              description: "What you actually see in the image (e.g. 'three small dark patches in a row near the ridge, ~3-4 ft long total, distinct from surrounding shingle texture'). Be specific. Do NOT use phrases like 'appears to' or 'might be' — if you're not sure, don't include the finding.",
            },
            location_description: {
              type: "string",
              description: "Plain-English location on the subject roof (e.g. 'south slope, near ridge, east half').",
            },
            severity: {
              type: "string",
              enum: ["low", "medium", "high"],
            },
            confidence: {
              type: "number",
              minimum: 0.5,
              maximum: 1.0,
              description: "Confidence in this finding being a real issue (not an artifact, shadow, or normal variation). Findings below 0.5 should be excluded entirely.",
            },
          },
        },
      },
      rationale: {
        type: "string",
        description: "One paragraph explaining the overall_condition assessment and how the findings (or lack thereof) were determined. Must reference specific visible cues, not inferences.",
      },
    },
  },
}

const SYSTEM_PROMPT = `You are an experienced roofing contractor inspecting a residential roof from a north-up satellite aerial image.

INPUT: A satellite image at zoom 20 (~0.06 m/px). An orange dashed bounding box and reticle mark THE subject home. A 50-ft scale bar is in the bottom-left.

YOUR TASK: Identify ONLY clearly-visible condition issues on the subject roof. This is for an instant-quote tool that will follow up with an in-person inspection — your job is to surface things worth a closer look, NOT to provide a full inspection report.

WHAT YOU CAN RELIABLY SEE AT THIS RESOLUTION:
- Tarps or coverings (large blue/brown patches that don't match surrounding material)
- Patching or repair (color variation, mismatched patches, recent-work signatures)
- Moss/biological growth (green/dark patches, especially on north-facing slopes)
- Missing material in obvious chunks (visible decking exposure, dark gaps in regular shingle pattern)
- Structural sag at ridges or valleys (geometric distortion vs neighboring homes)
- Foreign debris (tree branches, large items)
- Discoloration/staining patterns (water damage tracks, rust streaks)

WHAT YOU CANNOT RELIABLY SEE AT THIS RESOLUTION:
- Individual missing shingle tabs (too small)
- Cracked or curled shingles (texture too coarse)
- Flashing condition
- Underlayment damage
- Granule loss patterns

HARD RULES:
1. EMPTY findings array is the correct output when nothing notable is visible. Do NOT manufacture findings to seem thorough.
2. Each finding MUST cite a specific visible cue — what color, what shape, what location. If you can't write a sentence describing what you literally see, don't include the finding.
3. Forbidden phrases in descriptions: "appears to be", "might be", "could indicate", "possibly", "suggests". You see it or you don't.
4. If image quality (tree cover, shadows, angle) prevents reliable assessment, set overall_condition to "unable_to_assess" and explain why in rationale.
5. Confidence < 0.5 = exclude the finding entirely.
6. Maximum 5 findings — pick the most clearly-visible ones.

PROCESS: Look at the subject roof carefully. Reason step by step about what you actually see vs what you might be imagining. Then call report_roof_condition. Lean toward fewer findings with high confidence rather than many findings with speculation.`

export async function assessCondition({ annotatedPath, slug }) {
  console.log(`[condition] calling Claude Sonnet 4.x`)
  const { input, usage } = await runVisionCall({
    systemPrompt: SYSTEM_PROMPT,
    userText: `Analyze the roof condition of the subject home in the orange bounding box of ${slug}. Report findings only when clearly visible.`,
    imagePath: annotatedPath,
    tool: CONDITION_TOOL,
  })

  console.log(
    `[condition] usage: in=${usage.input_tokens} cache_read=${usage.cache_read_input_tokens ?? 0} cache_create=${usage.cache_creation_input_tokens ?? 0} out=${usage.output_tokens}`,
  )
  console.log(`[condition] ${input.overall_condition} (${input.findings.length} findings)`)

  return {
    overall_condition: input.overall_condition,
    findings: input.findings,
    rationale: input.rationale,
  }
}
