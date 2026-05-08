// PDF renderer — real implementation via Puppeteer.
// Takes an estimate object + the aerial image bytes and writes a US-Letter
// branded PDF to outputPath.

import puppeteer from "puppeteer"
import { readFile, writeFile, access } from "fs/promises"
import { renderEstimateHtml } from "./pdf-template.mjs"

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

export async function renderEstimatePdf({ estimate, outputPath, aerialPath, customer }) {
  // Inline the aerial as base64 so the PDF is self-contained.
  let aerialBuffer = null
  if (aerialPath && (await exists(aerialPath))) {
    aerialBuffer = await readFile(aerialPath)
  }

  const html = renderEstimateHtml({ estimate, aerialBuffer, customer })

  // Save the HTML next to the PDF for debugging — judges or teammates
  // can open it in a browser if rendering looks off.
  const htmlPath = outputPath.replace(/\.pdf$/, ".html")
  await writeFile(htmlPath, html)

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    await page.pdf({
      path: outputPath,
      format: "Letter",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
  } finally {
    await browser.close()
  }

  console.log(`[pdf] rendered → ${outputPath}`)
  return { stub: false, path: outputPath, htmlPath }
}
