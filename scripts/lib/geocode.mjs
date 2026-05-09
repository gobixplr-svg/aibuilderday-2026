// Geocoding via Google Maps Geocoding API.
// Input: address string. Output: { lat, lng, formatted_address, place_id }.

import {
  assertGeocodeInputLength,
  isAcceptablePropertyGeocodeResult,
  isPreciseGeocodeResult,
} from "./geocode-quality.mjs"

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

export async function geocode(address) {
  assertGeocodeInputLength(address)

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY missing in environment (.env.local)")
  }

  const url = `${GEOCODE_URL}?address=${encodeURIComponent(address)}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`[geocode] HTTP ${res.status} ${res.statusText}`)
  }

  const body = await res.json()
  if (body.status !== "OK") {
    throw new Error(`[geocode] API status ${body.status}: ${body.error_message || "(no detail)"}`)
  }

  const top = body.results[0]
  if (!top) {
    throw new Error(`[geocode] no results for address: ${address}`)
  }

  if (!isAcceptablePropertyGeocodeResult(top)) {
    const t = top.geometry?.location_type ?? "unknown"
    const typeStr = (top.types ?? []).join(", ") || "(none)"
    if (!isPreciseGeocodeResult(top)) {
      throw new Error(
        `[geocode] address resolved only to an imprecise location (${t}); need ROOFTOP or RANGE_INTERPOLATED. Check the street address.`,
      )
    }
    throw new Error(
      `[geocode] address must include a street-level location, not only city or ZIP (result types: ${typeStr}). Enter a full street address.`,
    )
  }

  return {
    input_address: address,
    formatted_address: top.formatted_address,
    place_id: top.place_id,
    lat: top.geometry.location.lat,
    lng: top.geometry.location.lng,
    location_type: top.geometry.location_type,
  }
}
