// Shared Anthropic SDK client + vision-call helper.
//
// Used by pitch.mjs and footprint.mjs to make Claude Sonnet 4.x vision calls
// with extended thinking, tool-use structured output, and prompt caching on
// the system prompt + tool definition (so iteration across the 5 calibration
// + 5 test properties hits the cache).
//
// Notes:
// - Render order is tools -> system -> messages. cache_control on the last
//   system block captures BOTH tools and system in one cached prefix.
// - Sonnet 4.6 minimum cacheable prefix is 2048 tokens. Our prompts are
//   verbose enough to clear that bar in normal conditions.
// - tool_choice is intentionally omitted (defaults to "auto"). Forcing
//   tool_choice while extended thinking is enabled has historical
//   compatibility issues; with a single well-described tool + a system
//   prompt that directs the model to call it, "auto" is reliable.

import Anthropic from "@anthropic-ai/sdk"
import { readFile } from "fs/promises"

export const MODEL = "claude-sonnet-4-6"

const client = new Anthropic({
  // ANTHROPIC_API_KEY is read from env automatically.
  maxRetries: 4, // SDK retries 429/5xx with exponential backoff
  // Per-request cap: an Anthropic outage during the Saturday 1:30 PM
  // submission run shouldn't pin a single property for 10 min × 4 retries
  // (the SDK default). 3 minutes is generous for adaptive thinking +
  // tool-use round-trip and still leaves headroom for retries.
  timeout: 180_000,
})

export async function runVisionCall({
  systemPrompt,
  userText,
  imagePath,
  tool,
  effort = "medium",
  // Extended thinking + tool_use needs headroom; 8k was truncating footprint calls.
  maxTokens = 16000,
}) {
  const imageData = (await readFile(imagePath)).toString("base64")

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    output_config: { effort },
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [tool],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: imageData },
          },
          { type: "text", text: userText },
        ],
      },
    ],
  })

  const toolUseBlock = response.content.find((b) => b.type === "tool_use")
  if (!toolUseBlock) {
    const textBlock = response.content.find((b) => b.type === "text")
    const text = textBlock?.text ?? ""
    const detail = text ? `Got text: ${text.slice(0, 200)}` : "No text block either."

    // Claude refusing to call the tool is correct behavior when the image
    // doesn't show a residential pitched roof (commercial property,
    // RANGE_INTERPOLATED geocode that landed on a parking lot, etc).
    // Surface as a typed condition so the API route can return a friendly
    // 422 instead of a 500 with a stack trace. Per CLAUDE.md hard rule #2,
    // we'd rather refuse than fabricate.
    const looksLikeNoRoof = /no\s+(residential\s+)?roof|cannot\s+(call|measure|identify|see)|not\s+a\s+residential|not\s+a\s+(pitched\s+)?roof|empty\s+lot|parking\s+lot|commercial\s+(building|property)|no\s+building/i.test(text)
    if (looksLikeNoRoof) {
      const err = new Error(`No residential roof detected at this address. The model said: "${text.slice(0, 240).trim()}"`)
      err.code = "NO_ROOF_DETECTED"
      throw err
    }

    throw new Error(
      `[claude] No tool_use block in response. stop_reason=${response.stop_reason}. ${detail}`,
    )
  }

  const thinkingBlock = response.content.find((b) => b.type === "thinking")

  return {
    input: toolUseBlock.input,
    thinking: thinkingBlock?.thinking,
    usage: response.usage,
    stop_reason: response.stop_reason,
  }
}
