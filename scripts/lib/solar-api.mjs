// Google Solar API — Building Insights wrapper.
//
// Used as a subject-disambiguator: given a lat/lng, returns the building
// polygon for the closest building so we can highlight it on the aerial
// before sending to Claude. The model still computes the measurement; we
// just tell it which structure to measure.
//
// Docs: https://developers.google.com/maps/documentation/solar/building-insights
//
// What we use:
// - solarPotential.buildingStats.areaMeters2  → ground truth sanity check
// - center { latitude, longitude }            → confirm we hit the right building
// - boundingBox { sw, ne }                    → for cropping/centering the aerial
// - solarPanelConfigs[0].roofSegmentSummaries → per-segment areas and pitches
// - imagery.dsmUrl, rgbUrl, maskUrl           → not used for now; could pull later
//
// We do NOT use Solar's roof-area number as our submitted answer. Pipeline
// remains: Claude measures from the satellite image, optionally with the
// Solar polygon overlaid as guidance.

const ENDPOINT = "https://solar.googleapis.com/v1/buildingInsights:findClosest"

export async function getBuildingInsights({ lat, lng, requiredQuality = "HIGH" }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY missing in environment")
  }

  const url = `${ENDPOINT}?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=${requiredQuality}&key=${apiKey}`
  const res = await fetch(url)

  if (!res.ok) {
    // Fall back to lower quality if HIGH isn't available for this address
    if (res.status === 404 && requiredQuality === "HIGH") {
      return getBuildingInsights({ lat, lng, requiredQuality: "MEDIUM" })
    }
    if (res.status === 404 && requiredQuality === "MEDIUM") {
      return getBuildingInsights({ lat, lng, requiredQuality: "LOW" })
    }
    const detail = await res.text().catch(() => "")
    throw new Error(`[solar] HTTP ${res.status}: ${detail.slice(0, 300)}`)
  }

  return res.json()
}

// Solar API returns the building's bounding box in lat/lng. To draw the
// polygon on our aerial JPEG we need to convert lat/lng → pixel coords
// relative to the image center and zoom level.
//
// Google Static Maps centers the image at our (lat, lng) request and uses
// Web Mercator. Pixel position relative to image center:
//   px_x = (lng - center_lng) / metersPerLng × meters_per_pixel
//   px_y = (center_lat - lat) / metersPerLat × meters_per_pixel
// where metersPerLng = 111320 × cos(lat), metersPerLat = 111320.
//
// scale = 2 (Google scale=2 → 1280px effective)
export function latLngToImagePixels({ lat, lng, centerLat, centerLng, metersPerPixel, imageWidth, imageHeight }) {
  const metersPerDegLat = 111320
  const metersPerDegLng = 111320 * Math.cos((centerLat * Math.PI) / 180)
  const dxMeters = (lng - centerLng) * metersPerDegLng
  const dyMeters = (centerLat - lat) * metersPerDegLat
  const dxPx = dxMeters / metersPerPixel
  const dyPx = dyMeters / metersPerPixel
  return {
    x: imageWidth / 2 + dxPx,
    y: imageHeight / 2 + dyPx,
  }
}
