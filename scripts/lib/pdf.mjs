// PDF rendering — STUB.
// Real implementation lands as task #7. Until then, writes a JSON file
// to estimate.json and a placeholder estimate.pdf-stub.txt so the
// outputs/<slug>/ directory shape is right.

import { writeFile } from "fs/promises"

export async function renderEstimatePdf({ estimate, outputPath }) {
  console.log(`[pdf] STUB — real PDF renderer lands in task #7.`)
  // Drop a marker file so we can see the slot is wired
  const placeholderPath = outputPath.replace(/\.pdf$/, ".stub.txt")
  await writeFile(
    placeholderPath,
    `STUB PDF placeholder.\nReal PDF will be written to: ${outputPath}\nGenerated at: ${new Date().toISOString()}\n`
  )
  return { stub: true, placeholder: placeholderPath }
}
