#!/usr/bin/env node
// scripts/fetch-aerial.mjs
//
// Geocode an address and download an aerial image. Caches both to
// intermediate/<slug>/.
//
// Usage:
//   node scripts/fetch-aerial.mjs "21106 Kenswick Meadows Ct, Humble, TX 77338"
//   node scripts/fetch-aerial.mjs "<address>" --no-cache
//   node scripts/fetch-aerial.mjs "<address>" --zoom 19

import "dotenv/config"
import { fetchAerialPipeline } from "./lib/aerial-pipeline.mjs"

const args = process.argv.slice(2)
if (args.length === 0 || args[0].startsWith("--")) {
  console.error("Usage: node scripts/fetch-aerial.mjs \"<address>\" [--no-cache] [--zoom N]")
  process.exit(1)
}

const address = args[0]
const noCache = args.includes("--no-cache")
const zoomArgIdx = args.indexOf("--zoom")
const zoom = zoomArgIdx > -1 ? Number(args[zoomArgIdx + 1]) : 20
if (Number.isNaN(zoom) || zoom < 1 || zoom > 21) {
  console.error(`[fetch-aerial] invalid zoom: ${args[zoomArgIdx + 1]}`)
  process.exit(1)
}

console.log(`[fetch-aerial] address: ${address}`)

fetchAerialPipeline({ address, zoom, noCache })
  .then(({ dir }) => console.log(`[fetch-aerial] done → ${dir}`))
  .catch((err) => {
    console.error(`[fetch-aerial] FAILED: ${err.message}`)
    if (process.env.DEBUG) console.error(err.stack)
    process.exit(2)
  })
