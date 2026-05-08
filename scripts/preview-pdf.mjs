#!/usr/bin/env node
// scripts/preview-pdf.mjs
//
// Render the PDF template with synthetic data so we can iterate the
// template without running the full pipeline. Outputs:
//   tmp/preview.html
//   tmp/preview.pdf
//
// Open the HTML in a browser to design quickly; open the PDF to verify
// the actual rendering. Re-run after each template tweak.
//
// Usage:
//   node scripts/preview-pdf.mjs
//   node scripts/preview-pdf.mjs --no-aerial   (skip the aerial thumb)

import "dotenv/config"
import { mkdir, readFile, access } from "fs/promises"
import { join } from "path"
import { renderEstimatePdf } from "./lib/pdf.mjs"
import { loadMaterials, buildEstimate } from "./lib/estimate.mjs"

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

const noAerial = process.argv.includes("--no-aerial")

// Synthetic measurement matching the 21106 Kenswick example property
// (numbers are in the ballpark of EagleView's reference for sanity).
// Real estimate is computed by Eric's engine via lib/estimate.mjs so the
// preview shows actual production output, not hardcoded line items.
const SAMPLE_MEASUREMENT = {
  slug: "21106-kenswick-meadows-ct-humble-tx-77338",
  address: "21106 Kenswick Meadows Ct, Humble, TX 77338",
  formatted_address: "21106 Kenswick Meadows Ct, Humble, TX 77338, USA",
  pitch: "6:12",
  pitch_multiplier: 1.118,
  pitch_confidence: 0.85,
  pitch_stub: false,
  footprint_sqft: 2150,
  footprint_confidence: 0.78,
  footprint_stub: false,
  line_items: { ridge: 26, hip: 101, valley: 38, rake: 83, eave: 164 },
  roof_area_sqft: 2403,
  computed_at: new Date().toISOString(),
}

const SAMPLE_CUSTOMER = {
  name: "Sarah Mitchell",
  email: "sarah.mitchell@example.com",
  phone: "(555) 123-4567",
  prepared_by: "Marcus Reyes · Senior Estimator",
}

async function run() {
  await mkdir("tmp", { recursive: true })

  // Build a real estimate via Eric's engine so the preview reflects
  // production output, not hardcoded numbers.
  const { materials } = await loadMaterials()
  const estimate = await buildEstimate({ measurement: SAMPLE_MEASUREMENT, materials })

  // Try to find a real aerial from earlier pipeline runs; fall back gracefully.
  let aerialPath = null
  if (!noAerial) {
    const guess = join("intermediate", SAMPLE_MEASUREMENT.slug, "aerial.jpg")
    if (await exists(guess)) {
      aerialPath = guess
      console.log(`[preview] using cached aerial: ${guess}`)
    } else {
      console.log(`[preview] no cached aerial found — preview will use a placeholder.`)
      console.log(`          to include a real one, run: npm run fetch-aerial-free -- "${SAMPLE_MEASUREMENT.address}"`)
    }
  }

  await renderEstimatePdf({
    estimate,
    outputPath: "tmp/preview.pdf",
    aerialPath,
    customer: SAMPLE_CUSTOMER,
  })

  console.log(`[preview] tier totals:`)
  for (const t of estimate.tiers) {
    console.log(`  ${t.tier_name}: $${t.subtotal.toLocaleString()}`)
  }
  console.log(`[preview] open tmp/preview.html in a browser to iterate the template`)
  console.log(`[preview] open tmp/preview.pdf to verify the rendering`)
}

run().catch((err) => {
  console.error(`[preview] FAILED: ${err.message}`)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(2)
})
