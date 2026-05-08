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
//
// Output:
//   intermediate/<slug>/geocode.json
//   intermediate/<slug>/aerial.jpg
//   intermediate/<slug>/meta.json   (image params, mpp, ftpp)
//
// Exit codes:
//   0 = success
//   1 = bad usage / missing args
//   2 = API or filesystem error

import "dotenv/config"
import { mkdir, writeFile, readFile, access } from "fs/promises"
import { join } from "path"
import { slugify } from "./lib/slug.mjs"
import { geocode } from "./lib/geocode.mjs"
import { fetchAerial, metersPerPixel, feetPerPixel } from "./lib/aerial.mjs"

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

const slug = slugify(address)
const dir = join("intermediate", slug)

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function run() {
  console.log(`[fetch-aerial] address: ${address}`)
  console.log(`[fetch-aerial] slug:    ${slug}`)
  console.log(`[fetch-aerial] dir:     ${dir}`)
  await mkdir(dir, { recursive: true })

  // 1. Geocode (cached)
  const geocodePath = join(dir, "geocode.json")
  let geo
  if (!noCache && (await exists(geocodePath))) {
    console.log(`[geocode] cache hit`)
    geo = JSON.parse(await readFile(geocodePath, "utf-8"))
  } else {
    console.log(`[geocode] calling Google Geocoding API`)
    geo = await geocode(address)
    await writeFile(geocodePath, JSON.stringify(geo, null, 2))
  }
  console.log(`[geocode] ${geo.formatted_address}`)
  console.log(`[geocode] (${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)}) [${geo.location_type}]`)

  // 2. Aerial (cached)
  const aerialPath = join(dir, "aerial.jpg")
  const metaPath = join(dir, "meta.json")
  if (!noCache && (await exists(aerialPath))) {
    console.log(`[aerial] cache hit (${aerialPath})`)
  } else {
    console.log(`[aerial] fetching Static Maps zoom=${zoom} size=640 scale=2 satellite`)
    const buf = await fetchAerial({ lat: geo.lat, lng: geo.lng, zoom, size: 640, scale: 2 })
    await writeFile(aerialPath, buf)
    const mpp = metersPerPixel({ lat: geo.lat, zoom, scale: 2 })
    const fpp = feetPerPixel({ lat: geo.lat, zoom, scale: 2 })
    const meta = {
      slug,
      address,
      formatted_address: geo.formatted_address,
      lat: geo.lat,
      lng: geo.lng,
      zoom,
      size_px: 640,
      scale: 2,
      effective_px: 1280,
      meters_per_pixel: mpp,
      feet_per_pixel: fpp,
      fetched_at: new Date().toISOString(),
    }
    await writeFile(metaPath, JSON.stringify(meta, null, 2))
    console.log(`[aerial] saved ${aerialPath} (${buf.byteLength} bytes)`)
    console.log(`[aerial] scale: ${mpp.toFixed(4)} m/px = ${fpp.toFixed(4)} ft/px`)
  }

  console.log(`[fetch-aerial] done`)
}

run().catch((err) => {
  console.error(`[fetch-aerial] FAILED: ${err.message}`)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(2)
})
