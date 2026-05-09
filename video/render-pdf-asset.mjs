// One-shot script: render outputs/3561-e-102nd-ct-thornton-co-80229/estimate.html
// to video/public/pdf-page-1.png via Puppeteer.
//
// IMPORTANT: This script reads the source HTML but does NOT modify anything in
// the parent project. It only writes a single PNG into video/public/.
// Run via:  cd video && node render-pdf-asset.mjs
// Uses puppeteer from the parent project's node_modules (we don't add deps to
// the video/ workspace for this one-shot operation).

import puppeteer from "../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const htmlPath = resolve(
  projectRoot,
  "outputs/3561-e-102nd-ct-thornton-co-80229/estimate.html",
);
const outPath = resolve(__dirname, "public/pdf-page-1.png");

if (!existsSync(htmlPath)) {
  console.error(`Source HTML not found: ${htmlPath}`);
  process.exit(1);
}
if (!existsSync(dirname(outPath))) {
  mkdirSync(dirname(outPath), { recursive: true });
}

console.log(`Rendering: ${htmlPath}`);
console.log(`         → ${outPath}`);

// Use file:// URL so relative aerial.jpg in the HTML resolves correctly
const fileUrl = pathToFileURL(htmlPath).href;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 850, height: 1100, deviceScaleFactor: 2 });
await page.goto(fileUrl, { waitUntil: "networkidle0" });
// Allow a beat for any web fonts / images to settle
await new Promise((r) => setTimeout(r, 250));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Wrote ${outPath}`);
