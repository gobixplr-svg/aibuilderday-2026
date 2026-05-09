import { NextRequest, NextResponse } from "next/server"
import { fetchRecentHailEvents } from "@/src/hail-leads/server/weather-client"
import { parseRegionCode } from "@/src/hail-leads/server/regions"

export async function GET(req: NextRequest) {
  const stateRaw = req.nextUrl.searchParams.get("state")?.trim().toUpperCase()
  const state = stateRaw && stateRaw.length === 2 ? stateRaw : undefined
  const region = parseRegionCode(req.nextUrl.searchParams.get("region"))
  const city = req.nextUrl.searchParams.get("city")?.trim()
  const daysBack = Number(req.nextUrl.searchParams.get("daysBack") ?? "5")
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "30")

  if (!state && !region) {
    return NextResponse.json(
      { error: "Provide state (2-letter) or region (NE, SE, SW, NW, Central)" },
      { status: 400 }
    )
  }
  if (state && region) {
    return NextResponse.json({ error: "Provide either state or region, not both" }, { status: 400 })
  }

  try {
    const events = await fetchRecentHailEvents({
      state,
      region,
      city,
      daysBack,
      limit,
    })
    return NextResponse.json({ events })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
