// Reusable geocode + aerial fetch step for the orchestrator.
// fetch-aerial.mjs is a thin CLI wrapper around this.

import { mkdir, writeFile, readFile, access } from "fs/promises"
import { join } from "path"
import { slugify } from "./slug.mjs"
import { geocode } from "./geocode.mjs"
import { fetchAerial, metersPerPixel, feetPerPixel } from "./aerial.mjs"
import { geocodeFree, fetchEsriComposite } from "./aerial-free.mjs"

function useGoogleMaps() {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim())
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function fetchAerialPipeline({ address, zoom = 20, noCache = false }) {
  const slug = slugify(address)
  const dir = join("intermediate", slug)
  await mkdir(dir, { recursive: true })

  // Geocode
  const geocodePath = join(dir, "geocode.json")
  let geo
  if (!noCache && (await exists(geocodePath))) {
    console.log(`[geocode] cache hit`)
    geo = JSON.parse(await readFile(geocodePath, "utf-8"))
  } else if (useGoogleMaps()) {
    console.log(`[geocode] calling Google Geocoding API`)
    geo = await geocode(address)
    await writeFile(geocodePath, JSON.stringify(geo, null, 2))
  } else {
    console.log(`[geocode] GOOGLE_MAPS_API_KEY unset — using Census/Nominatim + Esri imagery`)
    geo = await geocodeFree(address)
    await writeFile(geocodePath, JSON.stringify(geo, null, 2))
    await new Promise((r) => setTimeout(r, 1100))
  }
  console.log(`[geocode] ${geo.formatted_address}`)
  console.log(`[geocode] (${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)}) [${geo.location_type}]`)

  // Aerial
  const aerialPath = join(dir, "aerial.jpg")
  const metaPath = join(dir, "meta.json")
  let meta
  if (!noCache && (await exists(aerialPath)) && (await exists(metaPath))) {
    console.log(`[aerial] cache hit`)
    meta = JSON.parse(await readFile(metaPath, "utf-8"))
  } else if (useGoogleMaps()) {
    console.log(`[aerial] fetching Static Maps zoom=${zoom} size=640 scale=2 satellite`)
    const buf = await fetchAerial({ lat: geo.lat, lng: geo.lng, zoom, size: 640, scale: 2 })
    await writeFile(aerialPath, buf)
    const mpp = metersPerPixel({ lat: geo.lat, zoom, scale: 2 })
    const fpp = feetPerPixel({ lat: geo.lat, zoom, scale: 2 })
    meta = {
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
    console.log(`[aerial] saved (${buf.byteLength} bytes, ${mpp.toFixed(4)} m/px)`)
  } else {
    const esriZoom = Math.min(zoom, 19)
    if (esriZoom !== zoom) {
      console.log(`[aerial] Esri tiles max zoom 19; using zoom=${esriZoom} (requested ${zoom})`)
    }
    console.log(`[aerial] Esri World Imagery zoom=${esriZoom}`)
    const out = await fetchEsriComposite({ lat: geo.lat, lng: geo.lng, zoom: esriZoom })
    await writeFile(aerialPath, out.buffer)
    const mpp = metersPerPixel({ lat: geo.lat, zoom: esriZoom, scale: 1 })
    const fpp = feetPerPixel({ lat: geo.lat, zoom: esriZoom, scale: 1 })
    meta = {
      slug,
      address,
      formatted_address: geo.formatted_address,
      lat: geo.lat,
      lng: geo.lng,
      zoom: esriZoom,
      size_px: out.width,
      scale: 1,
      effective_px: out.width,
      meters_per_pixel: mpp,
      feet_per_pixel: fpp,
      source: `esri-world-imagery (${out.tileMode})`,
      fetched_at: new Date().toISOString(),
    }
    await writeFile(metaPath, JSON.stringify(meta, null, 2))
    console.log(`[aerial] saved (${out.buffer.byteLength} bytes, ${mpp.toFixed(4)} m/px)`)
  }

  return { slug, dir, geo, meta, aerialPath }
}
