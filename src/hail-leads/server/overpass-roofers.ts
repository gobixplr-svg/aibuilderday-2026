import type { ContractorLead, HailEvent } from "@/src/hail-leads/types"
import { resolveLocalityForLeads } from "@/src/hail-leads/server/lead-locality"
import { geocodeUsLocality } from "@/src/hail-leads/server/geocode-nominatim"

type OverpassElement = {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

type OverpassResponse = { elements?: OverpassElement[] }

const OVERPASS_URL = process.env.HAIL_OVERPASS_URL ?? "https://overpass-api.de/api/interpreter"

function tagsPhone(tags: Record<string, string> | undefined): string | undefined {
  if (!tags) return undefined
  return tags.phone ?? tags["contact:phone"] ?? tags["phone:mobile"]
}

function tagsEmail(tags: Record<string, string> | undefined): string | undefined {
  if (!tags) return undefined
  return tags.email ?? tags["contact:email"]
}

function elementCoords(el: OverpassElement): { lat: number; lon: number } | null {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lon: el.lon }
  if (el.center) return { lat: el.center.lat, lon: el.center.lon }
  return null
}

export async function fetchOverpassRoofingLeads(event: HailEvent): Promise<ContractorLead[]> {
  const alertBlob = `${event.title}\n${event.summary}`
  const locality = resolveLocalityForLeads(event.areaDescription, alertBlob, event.state)

  const box = await geocodeUsLocality(locality.nominatimAnchor)
  if (!box) return []

  const pad = 0.45
  const south = box.south - pad
  const north = box.north + pad
  const west = box.west - pad
  const east = box.east + pad

  const q = `
[out:json][timeout:45];
(
  node["craft"="roofer"](${south},${west},${north},${east});
  way["craft"="roofer"](${south},${west},${north},${east});
  node["shop"="roof"](${south},${west},${north},${east});
  way["shop"="roof"](${south},${west},${north},${east});
);
out center;
`.trim()

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": process.env.HAIL_USER_AGENT ?? "jobnimbus-hail-leads/1.0",
    },
    body: `data=${encodeURIComponent(q)}`,
    next: { revalidate: 1800 },
  })

  if (!res.ok) {
    throw new Error(`Overpass request failed (${res.status})`)
  }

  const payload = (await res.json()) as OverpassResponse
  const elements = payload.elements ?? []

  const leads: ContractorLead[] = []
  for (const el of elements) {
    const tags = el.tags
    const name = tags?.name?.trim()
    if (!name) continue
    const coords = elementCoords(el)
    const phone = tagsPhone(tags)
    const email = tagsEmail(tags)
    const city = tags?.["addr:city"] ?? tags?.["addr:suburb"]
    const state = tags?.["addr:state"] ?? event.state
    const street = [tags?.["addr:housenumber"], tags?.["addr:street"]].filter(Boolean).join(" ")
    const addrParts = [street, city, state].filter(Boolean)

    leads.push({
      id: `overpass-${el.type}-${el.id}`,
      name,
      leadType: "prospect",
      city: city ?? locality.displayCity,
      state,
      phone,
      email,
      website: tags?.website ?? tags?.["contact:website"],
      address: addrParts.length ? addrParts.join(", ") : undefined,
      lat: coords?.lat,
      lng: coords?.lon,
      source: "openstreetmap_overpass",
    })
  }

  return leads
}
