import type { ContractorLead, HailEvent } from "@/src/hail-leads/types"
import { resolveLocalityForLeads } from "@/src/hail-leads/server/lead-locality"

type YelpBusiness = {
  id: string
  name: string
  phone?: string
  url?: string
  location?: {
    city?: string
    state?: string
    address1?: string
    zip_code?: string
  }
}

type YelpSearchResponse = { businesses?: YelpBusiness[]; error?: { description?: string } }

/**
 * Yelp Fusion API — requires `HAIL_YELP_API_KEY` in `.env.local`.
 * https://docs.developer.yelp.com/docs/fusion-intro
 * Note: Yelp does not expose business email in the public Fusion API.
 */
export async function fetchYelpRoofingLeads(event: HailEvent): Promise<ContractorLead[]> {
  const apiKey = process.env.HAIL_YELP_API_KEY?.trim()
  if (!apiKey) return []

  const alertBlob = `${event.title}\n${event.summary}`
  const locality = resolveLocalityForLeads(event.areaDescription, alertBlob, event.state)
  const location = locality.nominatimAnchor

  const url = new URL("https://api.yelp.com/v3/businesses/search")
  url.searchParams.set("term", "roofing")
  url.searchParams.set("location", location)
  url.searchParams.set("limit", "15")

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": process.env.HAIL_USER_AGENT ?? "jobnimbus-hail-leads/1.0",
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    const errText = await res.text()
    console.warn("[hail-leads][yelp]", res.status, errText.slice(0, 300))
    return []
  }

  const data = (await res.json()) as YelpSearchResponse
  if (data.error?.description) {
    console.warn("[hail-leads][yelp]", data.error.description)
    return []
  }

  const businesses = data.businesses ?? []
  return businesses.map((b) => {
    const loc = b.location
    const addr = [loc?.address1, loc?.city, loc?.state, loc?.zip_code].filter(Boolean).join(", ")
    return {
      id: `yelp-${b.id}`,
      name: b.name,
      leadType: "prospect" as const,
      city: loc?.city,
      state: loc?.state ?? event.state,
      phone: b.phone,
      website: b.url,
      address: addr || undefined,
      source: "yelp_fusion",
    }
  })
}
