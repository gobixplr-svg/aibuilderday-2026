import { ContractorLead, HailEvent } from "@/src/hail-leads/types"
import { resolveLocalityForLeads } from "@/src/hail-leads/server/lead-locality"
import { geocodeUsLocality, nominatimRequestHeaders } from "@/src/hail-leads/server/geocode-nominatim"
import { fetchOverpassRoofingLeads } from "@/src/hail-leads/server/overpass-roofers"
import { fetchYelpRoofingLeads } from "@/src/hail-leads/server/yelp-roofers"

type NominatimPlace = {
  place_id: number
  display_name: string
  name?: string
  lat: string
  lon: string
  type?: string
  class?: string
  address?: {
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
  }
}

type LeadSourceResult = {
  source: string
  leads: ContractorLead[]
  durationMs: number
  error?: string
}

type LeadSourceAdapter = {
  name: string
  fetch: (event: HailEvent) => Promise<ContractorLead[]>
}

const CONTRACTOR_CACHE_TTL_MS = 30 * 60 * 1000
/** Overpass + multiple Nominatim round-trips can be slow. */
const REQUEST_TIMEOUT_MS = 55_000
const contractorCache = new Map<string, { expiresAt: number; leads: ContractorLead[] }>()

function normalizeState(input: string): string {
  return input.trim().toUpperCase()
}

function normalizeWebsite(value?: string): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  return `https://${trimmed}`
}

function normalizePhone(value?: string): string | undefined {
  if (!value) return undefined
  const digits = value.replace(/\D/g, "")
  if (digits.length < 10) return undefined
  return digits.length === 10 ? `+1${digits}` : `+${digits}`
}

function normalizeEmail(value?: string): string | undefined {
  if (!value?.trim()) return undefined
  const e = value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return undefined
  return e
}

function normalizeName(value?: string): string {
  const raw = value?.trim() ?? ""
  return raw || "Unknown Contractor"
}

function looksLikeJunk(lead: ContractorLead): boolean {
  const name = lead.name.toLowerCase()
  if (name === "unknown contractor" || name === "unknown") return true
  const hasSignal = !!(
    lead.address ||
    lead.phone ||
    lead.website ||
    lead.email ||
    (lead.lat != null && lead.lng != null)
  )
  if (!hasSignal && lead.name.trim().length < 2) return true
  return false
}

function normalizeLead(lead: ContractorLead, fallbackState: string): ContractorLead {
  return {
    ...lead,
    name: normalizeName(lead.name),
    state: normalizeState(lead.state ?? fallbackState),
    website: normalizeWebsite(lead.website),
    phone: normalizePhone(lead.phone),
    email: normalizeEmail(lead.email),
  }
}

function dedupeKey(lead: ContractorLead): string {
  const name = lead.name.toLowerCase().replace(/[^a-z0-9]/g, "")
  const phone = lead.phone?.replace(/\D/g, "") ?? ""
  const website = lead.website?.toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "") ?? ""
  const address = lead.address?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? ""
  const email = lead.email?.toLowerCase() ?? ""
  if (email) return `email:${email}`
  if (phone) return `phone:${phone}`
  if (website) return `web:${website}`
  return `name:${name}|addr:${address}`
}

/** Alphanumeric-only name for duplicate-name collapse (LLC vs L.L.C., etc.). */
function normalizedBusinessNameKey(lead: ContractorLead): string {
  const k = lead.name.toLowerCase().replace(/[^a-z0-9]/g, "")
  return k.length >= 2 ? k : `id:${lead.id}`
}

function contactRichness(lead: ContractorLead): number {
  let n = 0
  if (lead.leadType === "existing_customer") n += 20
  if (lead.email) n += 8
  if (lead.phone) n += 6
  if (lead.website) n += 4
  if (lead.address) n += 2
  if (lead.lat != null && lead.lng != null) n += 1
  return n
}

/** One row per distinct business name; keeps the record with the richest contact data. */
function dedupeByBusinessName(leads: ContractorLead[]): ContractorLead[] {
  const byName = new Map<string, ContractorLead>()
  for (const lead of leads) {
    const nk = normalizedBusinessNameKey(lead)
    const existing = byName.get(nk)
    if (!existing) {
      byName.set(nk, lead)
      continue
    }
    if (contactRichness(lead) > contactRichness(existing)) {
      byName.set(nk, lead)
    }
  }
  return [...byName.values()]
}

async function withTimeout<T>(task: Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("Request timed out")))
      }),
    ])
  } finally {
    clearTimeout(timeout)
  }
}

function safeJsonParse<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export async function fetchExistingCustomerLeads(event: HailEvent): Promise<ContractorLead[]> {
  const seededCustomers = safeJsonParse<ContractorLead[]>(process.env.HAIL_CUSTOMER_SOURCE_JSON, [])
  const state = normalizeState(event.state)
  return seededCustomers
    .filter((lead) => normalizeState(lead.state ?? "") === state)
    .map((lead) => ({
      ...lead,
      leadType: "existing_customer",
      source: lead.source || "jobnimbus_customer_seed",
    }))
}

function placeCity(place: NominatimPlace): string | undefined {
  const a = place.address
  if (!a) return undefined
  return a.city ?? a.town ?? a.village ?? a.county
}

function mapPlaceToLead(
  place: NominatimPlace,
  event: HailEvent,
  locality: { displayCity: string }
): ContractorLead {
  const name =
    place.name?.trim() ||
    place.display_name.split(",")[0]?.trim() ||
    "Unknown Contractor"
  const rowCity = placeCity(place) ?? locality.displayCity
  return {
    id: `prospect-${place.place_id}`,
    name,
    leadType: "prospect",
    city: rowCity,
    state: normalizeState(place.address?.state ?? event.state),
    address: place.display_name,
    lat: Number(place.lat),
    lng: Number(place.lon),
    source: "openstreetmap_nominatim",
  }
}

async function nominatimSearchPlaces(params: Record<string, string>): Promise<NominatimPlace[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("countrycodes", "us")
  url.searchParams.set("addressdetails", "1")

  const res = await fetch(url, {
    headers: nominatimRequestHeaders(),
    next: { revalidate: 3600 },
  })
  if (!res.ok) return []
  return (await res.json()) as NominatimPlace[]
}

export async function fetchProspectLeads(event: HailEvent): Promise<ContractorLead[]> {
  const alertBlob = `${event.title}\n${event.summary}`
  const locality = resolveLocalityForLeads(event.areaDescription, alertBlob, event.state)
  const anchor = locality.nominatimAnchor

  const merged = new Map<number, NominatimPlace>()
  const addPlaces = (arr: NominatimPlace[]) => {
    for (const p of arr) merged.set(p.place_id, p)
  }

  const geoHit = await geocodeUsLocality(anchor)
  const nominatimTasks: Promise<NominatimPlace[]>[] = []
  if (geoHit) {
    const viewbox = `${geoHit.west},${geoHit.south},${geoHit.east},${geoHit.north}`
    nominatimTasks.push(
      nominatimSearchPlaces({ q: "roofing", bounded: "1", viewbox, limit: "40" }),
      nominatimSearchPlaces({ q: "roofing contractor", bounded: "1", viewbox, limit: "40" }),
      nominatimSearchPlaces({ q: "roofer", bounded: "1", viewbox, limit: "25" })
    )
  }
  nominatimTasks.push(
    nominatimSearchPlaces({ q: `roofing near ${anchor}`, limit: "40" }),
    nominatimSearchPlaces({ q: `roofing contractor ${anchor}`, limit: "40" }),
    nominatimSearchPlaces({ q: `roofers ${anchor}`, limit: "30" })
  )
  const batches = await Promise.all(nominatimTasks)
  for (const arr of batches) addPlaces(arr)

  const places = [...merged.values()]
  if (places.length === 0) return []

  return places.map((place) => mapPlaceToLead(place, event, locality))
}

async function fetchSeedProspectLeads(event: HailEvent): Promise<ContractorLead[]> {
  const seededProspects = safeJsonParse<ContractorLead[]>(process.env.HAIL_PROSPECT_SOURCE_JSON, [])
  const state = normalizeState(event.state)
  return seededProspects
    .filter((lead) => normalizeState(lead.state ?? "") === state)
    .map((lead) => ({
      ...lead,
      leadType: "prospect",
      source: lead.source || "prospect_seed",
    }))
}

async function executeSource(source: LeadSourceAdapter, event: HailEvent): Promise<LeadSourceResult> {
  const startedAt = Date.now()
  try {
    const leads = await withTimeout(source.fetch(event))
    return {
      source: source.name,
      leads,
      durationMs: Date.now() - startedAt,
    }
  } catch (error) {
    return {
      source: source.name,
      leads: [],
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown source error",
    }
  }
}

function cacheKeyForEvent(event: HailEvent): string {
  return JSON.stringify({
    id: event.id,
    areaDescription: event.areaDescription,
    state: normalizeState(event.state),
    startsAt: event.startsAt,
  })
}

export async function fetchContractorLeads(event: HailEvent): Promise<ContractorLead[]> {
  const key = cacheKeyForEvent(event)
  const cached = contractorCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.leads
  }

  const sources: LeadSourceAdapter[] = [
    { name: "existing_customers", fetch: fetchExistingCustomerLeads },
    { name: "yelp_fusion", fetch: fetchYelpRoofingLeads },
    { name: "osm_overpass_roofers", fetch: fetchOverpassRoofingLeads },
    { name: "prospects_nominatim", fetch: fetchProspectLeads },
    { name: "prospects_seed", fetch: fetchSeedProspectLeads },
  ]

  const sourceResults = await Promise.all(sources.map((source) => executeSource(source, event)))
  for (const result of sourceResults) {
    if (result.error) {
      console.log("[hail-leads][source-error]", {
        source: result.source,
        error: result.error,
        durationMs: result.durationMs,
      })
      continue
    }
    console.log("[hail-leads][source-ok]", {
      source: result.source,
      count: result.leads.length,
      durationMs: result.durationMs,
    })
  }

  const deduped = new Map<string, ContractorLead>()
  for (const result of sourceResults) {
    for (const rawLead of result.leads) {
      const lead = normalizeLead(rawLead, event.state)
      if (looksLikeJunk(lead)) continue
      const key = dedupeKey(lead)
      const existing = deduped.get(key)
      if (!existing) {
        deduped.set(key, lead)
        continue
      }
      const existingHasContact = !!(existing.phone || existing.website || existing.email)
      const leadHasContact = !!(lead.phone || lead.website || lead.email)
      if (!existingHasContact && leadHasContact) {
        deduped.set(key, lead)
      }
    }
  }

  const leads = dedupeByBusinessName([...deduped.values()])
  contractorCache.set(key, { expiresAt: Date.now() + CONTRACTOR_CACHE_TTL_MS, leads })
  console.log("[hail-leads][source-summary]", {
    sourceCount: sourceResults.length,
    dedupedCount: leads.length,
    eventId: event.id,
  })

  return leads
}
