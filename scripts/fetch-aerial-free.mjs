#!/usr/bin/env node
// scripts/fetch-aerial-free.mjs
//
// Stand-in aerial fetcher. Uses NO API keys — pulls geocoding from
// OpenStreetMap Nominatim (free, no auth, ~1 req/s rate limit) and
// satellite imagery from Esri's World Imagery service (free, no auth).
//
// Saves to the same intermediate/<slug>/ paths that the real Google
// Static Maps pipeline uses, so calibration / preview / vision prompts
// can all use these images interchangeably while we wait for a Google
// Maps key.
//
// This is for hackathon stand-in only. The real submission run should
// use Google Static Maps via scripts/fetch-aerial.mjs once a key is
// available — Esri imagery date and resolution may differ from
// Google's, which can affect calibration.
//
// Usage:
//   node scripts/fetch-aerial-free.mjs "21106 Kenswick Meadows Ct, Humble, TX 77338"
//   node scripts/fetch-aerial-free.mjs --all                        (all 10 bounty properties)
//   node scripts/fetch-aerial-free.mjs --examples                   (5 example only)
//   node scripts/fetch-aerial-free.mjs "<address>" --zoom 19

import "./lib/env.mjs"
import { mkdir, writeFile, readFile, access } from "fs/promises"
import { join } from "path"
import { slugify } from "./lib/slug.mjs"
import { metersPerPixel, feetPerPixel } from "./lib/aerial.mjs"
import { geocodeFree, fetchEsriComposite } from "./lib/aerial-free.mjs"

const EXAMPLES = [
  "21106 Kenswick Meadows Ct, Humble, TX 77338",
  "5914 Copper Lilly Lane, Spring, TX 77389",
  "122 NW 13th Ave, Cape Coral, FL 33993",
  "14132 Trenton Ave, Orland Park, IL 60462",
  "835 S Cobble Creek, Nixa, MO 65714",
]

const TESTS = [
  "3561 E 102nd Ct, Thornton, CO 80229",
  "1612 S Canton Ave, Springfield, MO 65802",
  "6310 Laguna Bay Court, Houston, TX 77041",
  "3820 E Rosebrier St, Springfield, MO 65809",
  "1261 20th Street, Newport News, VA 23607",
]

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function fetchOne(address, { zoom = 19, noCache = false } = {}) {
  const slug = slugify(address)
  const dir = join("intermediate", slug)
  await mkdir(dir, { recursive: true })

  // Geocode (cached)
  const geocodePath = join(dir, "geocode.json")
  let geo
  if (!noCache && (await exists(geocodePath))) {
    geo = JSON.parse(await readFile(geocodePath, "utf-8"))
    console.log(`[geocode] cache hit (${geo.source || "google"})`)
  } else {
    console.log(`[geocode] looking up: ${address}`)
    geo = await geocodeFree(address)
    await writeFile(geocodePath, JSON.stringify(geo, null, 2))
    // Be polite — Nominatim wants <=1 rps; Census is fine but small delay is harmless
    await new Promise((r) => setTimeout(r, 1100))
  }
  console.log(`[geocode] ${geo.formatted_address.slice(0, 80)}`)
  console.log(`[geocode] (${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)})`)

  // Aerial (cached)
  const aerialPath = join(dir, "aerial.jpg")
  const metaPath = join(dir, "meta.json")
  if (!noCache && (await exists(aerialPath)) && (await exists(metaPath))) {
    console.log(`[aerial] cache hit`)
    return { slug, dir, geo }
  }

  console.log(`[aerial] Esri World Imagery zoom=${zoom}`)
  const out = await fetchEsriComposite({ lat: geo.lat, lng: geo.lng, zoom })
  await writeFile(aerialPath, out.buffer)
  // Esri tiles are 256px at standard Web Mercator; effective scale is the same
  // as Google's at scale=1, so we use scale=1 here.
  const mpp = metersPerPixel({ lat: geo.lat, zoom, scale: 1 })
  const fpp = feetPerPixel({ lat: geo.lat, zoom, scale: 1 })
  const meta = {
    slug,
    address,
    formatted_address: geo.formatted_address,
    lat: geo.lat,
    lng: geo.lng,
    zoom,
    size_px: out.width,
    scale: 1,
    effective_px: out.width,
    meters_per_pixel: mpp,
    feet_per_pixel: fpp,
    source: `esri-world-imagery (${out.tileMode})`,
    fetched_at: new Date().toISOString(),
  }
  await writeFile(metaPath, JSON.stringify(meta, null, 2))
  console.log(`[aerial] saved (${out.buffer.byteLength} bytes, ${mpp.toFixed(4)} m/px = ${fpp.toFixed(4)} ft/px)`)
  return { slug, dir, geo, meta }
}

async function run() {
  const args = process.argv.slice(2)
  const noCache = args.includes("--no-cache")
  const all = args.includes("--all")
  const examplesOnly = args.includes("--examples")
  const zoomArgIdx = args.indexOf("--zoom")
  const zoom = zoomArgIdx > -1 ? Number(args[zoomArgIdx + 1]) : 19
  if (Number.isNaN(zoom) || zoom < 1 || zoom > 19) {
    console.error(`[fetch-aerial-free] zoom must be 1-19 (Esri max). Got: ${args[zoomArgIdx + 1]}`)
    process.exit(1)
  }

  let addresses
  if (all) addresses = [...EXAMPLES, ...TESTS]
  else if (examplesOnly) addresses = EXAMPLES
  else if (args.length && !args[0].startsWith("--")) addresses = [args[0]]
  else {
    console.error('Usage: node scripts/fetch-aerial-free.mjs "<address>" | --all | --examples')
    console.error("       optional: --zoom N (1-19), --no-cache")
    process.exit(1)
  }

  let ok = 0
  let fail = 0
  for (const address of addresses) {
    console.log(`\n=== ${address} ===`)
    try {
      await fetchOne(address, { zoom, noCache })
      ok++
    } catch (err) {
      console.error(`[fetch-aerial-free] FAILED: ${err.message}`)
      fail++
    }
  }
  console.log(`\n[fetch-aerial-free] ${ok} ok, ${fail} failed`)
  if (fail) process.exit(2)
}

run().catch((err) => {
  console.error(`[fetch-aerial-free] FAILED: ${err.message}`)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(2)
})
