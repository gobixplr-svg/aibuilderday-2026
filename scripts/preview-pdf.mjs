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

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

const noAerial = process.argv.includes("--no-aerial")

const SAMPLE_ESTIMATE = {
  measurement: {
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
  },
  tiers: [
    {
      tier_id: "standard",
      tier_name: "3-Tab Asphalt Shingle",
      lines: [
        { label: "3-Tab Asphalt Shingle (24.03 sq)", amount: 2643.30 },
        { label: "Labor (24.03 sq × 1.5h × $75/h)", amount: 2703.38 },
        { label: "Underlayment (24.03 sq)", amount: 600.75 },
        { label: "Drip edge (164 lf)", amount: 410.00 },
        { label: "Ridge cap (127 lf)", amount: 635.00 },
      ],
      subtotal: 6992.43,
    },
    {
      tier_id: "premium",
      tier_name: "Architectural Laminate (GAF Timberline HDZ)",
      lines: [
        { label: "Architectural Laminate (24.03 sq)", amount: 3484.35 },
        { label: "Labor (24.03 sq × 2.0h × $75/h)", amount: 3604.50 },
        { label: "Underlayment (24.03 sq)", amount: 600.75 },
        { label: "Drip edge (164 lf)", amount: 410.00 },
        { label: "Ridge cap (127 lf)", amount: 635.00 },
        { label: "Ice & water shield", amount: 780.00 },
      ],
      subtotal: 9514.60,
    },
    {
      tier_id: "luxury",
      tier_name: "Designer / Impact-Resistant",
      lines: [
        { label: "Designer Shingle (24.03 sq)", amount: 5286.60 },
        { label: "Labor (24.03 sq × 2.5h × $75/h)", amount: 4505.63 },
        { label: "Underlayment + ice & water (24.03 sq)", amount: 1200.00 },
        { label: "Drip edge + premium ridge cap", amount: 1310.00 },
        { label: "Copper flashing upgrade", amount: 480.00 },
      ],
      subtotal: 12782.23,
    },
  ],
  generated_at: new Date().toISOString(),
}

const SAMPLE_CUSTOMER = {
  name: "Sarah Mitchell",
  email: "sarah.mitchell@example.com",
  phone: "(555) 123-4567",
  prepared_by: "Marcus Reyes · Senior Estimator",
}

async function run() {
  await mkdir("tmp", { recursive: true })

  // Try to find a real aerial from earlier pipeline runs; fall back gracefully.
  let aerialPath = null
  if (!noAerial) {
    const guess = join("intermediate", SAMPLE_ESTIMATE.measurement.slug, "aerial.jpg")
    if (await exists(guess)) {
      aerialPath = guess
      console.log(`[preview] using cached aerial: ${guess}`)
    } else {
      console.log(`[preview] no cached aerial found — preview will use a placeholder.`)
      console.log(`          to include a real one, run: npm run fetch-aerial -- "${SAMPLE_ESTIMATE.measurement.address}"`)
    }
  }

  await renderEstimatePdf({
    estimate: SAMPLE_ESTIMATE,
    outputPath: "tmp/preview.pdf",
    aerialPath,
    customer: SAMPLE_CUSTOMER,
  })

  console.log(`[preview] open tmp/preview.html in a browser to iterate the template`)
  console.log(`[preview] open tmp/preview.pdf to verify the rendering`)
}

run().catch((err) => {
  console.error(`[preview] FAILED: ${err.message}`)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(2)
})
