import { NextRequest, NextResponse } from "next/server"
import {
  isAcceptablePropertyGeocodeResult,
  MAX_GEOCODE_INPUT_LENGTH,
} from "../../../scripts/lib/geocode-quality.mjs"

// Lightweight geocode check for the UI — mirrors scripts/lib/geocode.mjs so
// invalid addresses fail before /api/measure spawns the full pipeline.

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

type GeocodeHit = {
  formatted_address: string
  place_id: string
  types: string[]
  geometry: { location: { lat: number; lng: number }; location_type?: string }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const raw = body?.address
  if (typeof raw !== "string" || !raw.trim()) {
    return NextResponse.json(
      { error: "Incorrect address. Please try again.", code: "INVALID_ADDRESS" },
      { status: 422 },
    )
  }
  const address = raw.trim()

  if (address.length > MAX_GEOCODE_INPUT_LENGTH) {
    return NextResponse.json(
      { error: "Incorrect address. Please try again.", code: "INVALID_ADDRESS" },
      { status: 422 },
    )
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: "Geocoding is not configured on this server.", code: "GEOCODE_UNAVAILABLE" },
      { status: 503 },
    )
  }

  const url = `${GEOCODE_URL}?address=${encodeURIComponent(address)}&key=${apiKey}`
  let data: {
    status: string
    results?: GeocodeHit[]
    error_message?: string
  }
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json(
        { error: "Incorrect address. Please try again.", code: "INVALID_ADDRESS" },
        { status: 422 },
      )
    }
    data = await res.json()
  } catch {
    return NextResponse.json(
      {
        error: "Could not reach geocoding service. Check your connection and try again.",
        code: "GEOCODE_NETWORK",
      },
      { status: 502 },
    )
  }

  if (data.status === "OVER_QUERY_LIMIT") {
    return NextResponse.json(
      {
        error: "Map lookup quota exceeded. Please try again in a few minutes.",
        code: "GEOCODE_QUOTA",
      },
      { status: 503 },
    )
  }

  if (data.status === "REQUEST_DENIED") {
    return NextResponse.json(
      {
        error: "Geocoding was denied. Verify the Maps API key and enabled APIs.",
        code: "GEOCODE_DENIED",
      },
      { status: 503 },
    )
  }

  if (data.status === "OK" && data.results?.[0]) {
    const top = data.results[0]
    if (!isAcceptablePropertyGeocodeResult(top)) {
      return NextResponse.json(
        { error: "Incorrect address. Please try again.", code: "INVALID_ADDRESS" },
        { status: 422 },
      )
    }
    return NextResponse.json({
      formatted_address: top.formatted_address,
      place_id: top.place_id,
      lat: top.geometry.location.lat,
      lng: top.geometry.location.lng,
      location_type: top.geometry.location_type,
    })
  }

  if (data.status === "ZERO_RESULTS" || data.status === "INVALID_REQUEST") {
    return NextResponse.json(
      { error: "Incorrect address. Please try again.", code: "INVALID_ADDRESS" },
      { status: 422 },
    )
  }

  return NextResponse.json(
    {
      error: data.error_message || `Geocoding failed (${data.status}).`,
      code: "GEOCODE_ERROR",
    },
    { status: 502 },
  )
}
