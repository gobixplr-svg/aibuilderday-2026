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

import "dotenv/config"
import { mkdir, writeFile, readFile, access } from "fs/promises"
import { join } from "path"
import { slugify } from "./lib/slug.mjs"
import { metersPerPixel, feetPerPixel } from "./lib/aerial.mjs"

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
const ESRI_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile"

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

// Census Bureau Geocoder — free, no auth, US-only, excellent residential
// coverage. Tries this first because Nominatim misses many US residential
// streets, especially in newer subdivisions.
async function geocodeCensus(address) {
  const url = `${CENSUS_URL}?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`[geocode-census] HTTP ${res.status}`)
  const body = await res.json()
  const match = body?.result?.addressMatches?.[0]
  if (!match) throw new Error(`[geocode-census] no results`)
  return {
    input_address: address,
    formatted_address: match.matchedAddress,
    place_id: String(match.tigerLine?.tigerLineId || ""),
    lat: Number(match.coordinates.y),
    lng: Number(match.coordinates.x),
    location_type: "residential",
    source: "census",
  }
}

async function geocodeNominatim(address) {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(address)}`
  const res = await fetch(url, {
    headers: { "User-Agent": "AIBuilderDay2026/0.1 (hackathon stand-in)" },
  })
  if (!res.ok) throw new Error(`[geocode-nominatim] HTTP ${res.status}`)
  const arr = await res.json()
  if (!arr.length) throw new Error(`[geocode-nominatim] no results`)
  const top = arr[0]
  return {
    input_address: address,
    formatted_address: top.display_name,
    place_id: String(top.place_id),
    lat: Number(top.lat),
    lng: Number(top.lon),
    location_type: top.osm_type,
    source: "nominatim",
  }
}

// Try Census first, fall back to Nominatim. Both are free + no-auth.
async function geocodeFree(address) {
  try {
    return await geocodeCensus(address)
  } catch (censusErr) {
    console.log(`[geocode] Census missed: ${censusErr.message}; trying Nominatim`)
    try {
      return await geocodeNominatim(address)
    } catch (nomErr) {
      throw new Error(`Census + Nominatim both failed: ${censusErr.message} / ${nomErr.message}`)
    }
  }
}

// Web Mercator tile coordinates
function lngToTileX(lng, z) {
  return ((lng + 180) / 360) * Math.pow(2, z)
}
function latToTileY(lat, z) {
  const rad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, z)
}

// Compose a 2x2 grid of 256px tiles into one ~512px image, then crop to
// 640x640 around the address center. Uses sharp if available; falls back
// to single-tile fetch otherwise (lower fidelity but still demos).
async function fetchEsriComposite({ lat, lng, zoom = 19 }) {
  const txF = lngToTileX(lng, zoom)
  const tyF = latToTileY(lat, zoom)
  // 4x4 = 1024px area centered on the point; we'll center-crop to ~640.
  const TILES = 4
  const baseX = Math.floor(txF) - Math.floor(TILES / 2)
  const baseY = Math.floor(tyF) - Math.floor(TILES / 2)

  let sharp
  try {
    sharp = (await import("sharp")).default
  } catch {
    // Fallback: just fetch the central tile
    const tx = Math.floor(txF)
    const ty = Math.floor(tyF)
    const url = `${ESRI_TILE_URL}/${zoom}/${ty}/${tx}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`[aerial] HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    return { buffer: buf, width: 256, height: 256, zoom, tileMode: "single" }
  }

  // Fetch all tiles in parallel
  const tiles = []
  for (let dy = 0; dy < TILES; dy++) {
    for (let dx = 0; dx < TILES; dx++) {
      const tx = baseX + dx
      const ty = baseY + dy
      tiles.push({ dx, dy, url: `${ESRI_TILE_URL}/${zoom}/${ty}/${tx}` })
    }
  }
  const fetched = await Promise.all(
    tiles.map(async (t) => {
      const res = await fetch(t.url)
      if (!res.ok) throw new Error(`[aerial] tile ${t.url} → HTTP ${res.status}`)
      return { ...t, buffer: Buffer.from(await res.arrayBuffer()) }
    })
  )

  // Composite tiles into a TILES*256 px square
  const fullSize = TILES * 256
  const composite = await sharp({
    create: { width: fullSize, height: fullSize, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .composite(fetched.map((f) => ({ input: f.buffer, top: f.dy * 256, left: f.dx * 256 })))
    .jpeg({ quality: 92 })
    .toBuffer()

  // The address point inside the composite
  const pxInComposite = {
    x: (txF - baseX) * 256,
    y: (tyF - baseY) * 256,
  }

  // Crop a 640x640 window centered on the point (clamped to bounds)
  const TARGET = 640
  const left = Math.max(0, Math.min(fullSize - TARGET, Math.round(pxInComposite.x - TARGET / 2)))
  const top = Math.max(0, Math.min(fullSize - TARGET, Math.round(pxInComposite.y - TARGET / 2)))
  const cropped = await sharp(composite).extract({ left, top, width: TARGET, height: TARGET }).jpeg({ quality: 92 }).toBuffer()

  return { buffer: cropped, width: TARGET, height: TARGET, zoom, tileMode: "composite" }
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
