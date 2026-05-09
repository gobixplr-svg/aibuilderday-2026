import { HailEvent, HailSearchParams } from "@/src/hail-leads/types"
import { US_REGION_STATE_CODES, type UsRegionCode } from "@/src/hail-leads/server/regions"
import { resolveLocalityForLeads } from "@/src/hail-leads/server/lead-locality"

type NwsAlertFeature = {
  id: string
  properties: {
    event?: string
    headline?: string
    areaDesc?: string
    sent?: string
    onset?: string
    ends?: string
    severity?: string
    description?: string
    instruction?: string
    geocode?: { UGC?: string[] }
  }
}

const NWS_API_BASE = process.env.HAIL_API_BASE_URL ?? "https://api.weather.gov"
const CACHE_TTL_MS = 30 * 60 * 1000
const requestCache = new Map<string, { expiresAt: number; data: HailEvent[] }>()

function normalizeState(value: string): string {
  return value.trim().toUpperCase()
}

function roundInches2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Max wind speed in mph mentioned in alert text (gusts, sustained, or ranges). */
function extractWindMph(text: string): number | undefined {
  const candidates: number[] = []
  const patterns: RegExp[] = [
    /wind\s+gusts?(?:\s+up)?(?:\s+to)?(?:\s+of)?\s+(\d+)\s*mph/gi,
    /gusts?(?:\s+up)?(?:\s+to)?(?:\s+of)?\s+(\d+)\s*mph/gi,
    /(\d+)\s*mph\s*(?:wind|winds|gusts?)/gi,
    /sustained\s+winds?\s+(?:of|to|up\s+to)\s+(\d+)/gi,
    /(\d+)\s*to\s*(\d+)\s*mph/gi,
    /in\s+excess\s+of\s+(\d+)\s*mph/gi,
  ]

  for (const re of patterns) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      if (m[2]) {
        candidates.push(Number(m[1]), Number(m[2]))
      } else if (m[1]) {
        candidates.push(Number(m[1]))
      }
    }
  }

  if (candidates.length === 0) return undefined
  return Math.max(...candidates)
}

function extractHailSizeInches(text: string): number | undefined {
  const inchesMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:inch|inches|in)\s*hail/i)
  if (inchesMatch?.[1]) {
    return roundInches2(Number.parseFloat(inchesMatch[1]))
  }

  const quarterInch = text.match(/quarter(?:[\s-]inch|\s+size)?/i)
  if (quarterInch) return roundInches2(1)

  const halfDollar = text.match(/half[\s-]dollar/i)
  if (halfDollar) return roundInches2(1.25)

  const golfBall = text.match(/golf[\s-]ball/i)
  if (golfBall) return roundInches2(1.75)

  const baseball = text.match(/baseball|softball/i)
  if (baseball) return roundInches2(2.75)

  const pea = text.match(/pea(?:\s+size)?/i)
  if (pea) return roundInches2(0.25)

  const penny = text.match(/penny(?:\s+size)?/i)
  if (penny) return roundInches2(0.75)

  return undefined
}

function severityToBaseScore(severity?: string): number {
  const normalized = (severity ?? "").toLowerCase()
  if (normalized.includes("extreme")) return 95
  if (normalized.includes("severe")) return 78
  if (normalized.includes("moderate")) return 62
  return 45
}

function computeRecencyScore(startsAtIso: string): number {
  const start = new Date(startsAtIso).getTime()
  const hoursAgo = Math.max(0, (Date.now() - start) / (1000 * 60 * 60))
  const score = Math.max(0, 100 - hoursAgo * 2.5)
  return Math.round(score)
}

function toEventSeverity(score: number): HailEvent["severity"] {
  if (score >= 85) return "extreme"
  if (score >= 70) return "severe"
  if (score >= 55) return "moderate"
  return "minor"
}

function isStormLeadCandidate(description: string, eventName?: string): boolean {
  const blob = `${eventName ?? ""} ${description}`.toLowerCase()
  if (/hail/.test(blob)) return true
  if (/severe thunderstorm|tornado|damaging wind|destructive (?:storm|wind)|extreme wind/i.test(blob)) {
    return true
  }
  return false
}

/** Product focus: significant hail (>= 1") or damaging wind gusts (> 60 mph). */
function meetsHighImpactFocus(hailSizeInches: number | undefined, windMph: number | undefined): boolean {
  const hailOk = hailSizeInches !== undefined && hailSizeInches >= 1
  const windOk = windMph !== undefined && windMph > 60
  return hailOk || windOk
}

function computeThreatScore(
  nwsSeverity: string | undefined,
  hailSizeInches: number | undefined,
  windMph: number | undefined
): number {
  let score = severityToBaseScore(nwsSeverity) * 0.35

  if (hailSizeInches !== undefined) {
    if (hailSizeInches >= 1) {
      score += 42 + Math.min(18, (hailSizeInches - 1) * 12)
    } else {
      score += Math.min(28, hailSizeInches * 22)
    }
  }

  if (windMph !== undefined) {
    if (windMph > 60) {
      score += 40 + Math.min(15, (windMph - 60) * 0.35)
    } else {
      score += Math.min(22, windMph * 0.28)
    }
  }

  return Math.min(100, Math.round(score))
}

/** Sort: largest hail first, then strongest wind, then most recent. Missing hail sorts below any measured hail. */
function compareEventPriority(a: HailEvent, b: HailEvent): number {
  const hailA = a.hailSizeInches ?? -1
  const hailB = b.hailSizeInches ?? -1
  if (hailB !== hailA) return hailB - hailA

  const windA = a.windGustMph ?? -1
  const windB = b.windGustMph ?? -1
  if (windB !== windA) return windB - windA

  const recencyDiff = b.recencyScore - a.recencyScore
  if (recencyDiff !== 0) return recencyDiff

  return a.id.localeCompare(b.id)
}

function assignPriorityRanks(events: HailEvent[]): HailEvent[] {
  const n = events.length
  if (n === 0) return events
  return events.map((event, index) => ({
    ...event,
    leadPriorityScore: n <= 1 ? 100 : Math.max(1, Math.round(100 - (index / (n - 1)) * 99)),
  }))
}

function toHailEvent(
  feature: NwsAlertFeature,
  state: string,
  queryRegion?: UsRegionCode
): HailEvent | null {
  const p = feature.properties
  const title = p.headline ?? p.event ?? "Storm alert"
  const description = `${p.event ?? ""} ${p.headline ?? ""} ${p.description ?? ""}`.trim()

  if (!isStormLeadCandidate(description, p.event)) {
    return null
  }

  const startsAt = p.onset ?? p.sent
  if (!startsAt) {
    return null
  }

  const hailSizeInches = extractHailSizeInches(description)
  const windGustMph = extractWindMph(description)

  if (!meetsHighImpactFocus(hailSizeInches, windGustMph)) {
    return null
  }

  const severityScore = computeThreatScore(p.severity, hailSizeInches, windGustMph)
  const recencyScore = computeRecencyScore(startsAt)
  const areaDescription = p.areaDesc ?? "Unknown impacted area"
  const { displayCity } = resolveLocalityForLeads(areaDescription, description, state)

  return {
    id: feature.id,
    title,
    state,
    queryRegion,
    city: displayCity,
    areaDescription,
    startsAt,
    endsAt: p.ends,
    hailSizeInches,
    windGustMph,
    severity: toEventSeverity(severityScore),
    severityScore,
    recencyScore,
    leadPriorityScore: 0,
    source: "nws",
    sourceUrl: `https://api.weather.gov/alerts/${feature.id}`,
    summary: p.description ?? p.instruction ?? title,
  }
}

function filterByCity(events: HailEvent[], city?: string): HailEvent[] {
  if (!city?.trim()) {
    return events
  }
  const needle = city.trim().toLowerCase()
  return events.filter((event) => event.areaDescription.toLowerCase().includes(needle))
}

async function fetchAlertsForState(state: string): Promise<NwsAlertFeature[]> {
  const requestUrl = new URL("/alerts", NWS_API_BASE)
  requestUrl.searchParams.set("area", normalizeState(state))
  requestUrl.searchParams.set("status", "actual")
  requestUrl.searchParams.set("message_type", "alert")

  const response = await fetch(requestUrl, {
    headers: {
      Accept: "application/geo+json",
      "User-Agent": process.env.HAIL_USER_AGENT ?? "jobnimbus-hail-leads/1.0",
      ...(process.env.HAIL_API_KEY ? { Authorization: `Bearer ${process.env.HAIL_API_KEY}` } : {}),
    },
    next: { revalidate: 1800 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch weather alerts for ${state} (${response.status})`)
  }

  const payload = (await response.json()) as { features?: NwsAlertFeature[] }
  return payload.features ?? []
}

export async function fetchRecentHailEvents(params: HailSearchParams): Promise<HailEvent[]> {
  const daysBack = Math.max(1, Math.min(14, params.daysBack ?? 5))
  const limit = Math.max(1, Math.min(100, params.limit ?? 30))

  const states: { code: string; region?: UsRegionCode }[] = []
  if (params.region) {
    for (const code of US_REGION_STATE_CODES[params.region]) {
      states.push({ code, region: params.region })
    }
  } else if (params.state) {
    states.push({ code: normalizeState(params.state) })
  } else {
    throw new Error("Either state or region is required")
  }

  const cacheKey = JSON.stringify({
    scope: params.region ?? normalizeState(params.state ?? ""),
    city: params.city ?? "",
    daysBack,
    limit,
  })
  const cached = requestCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const now = Date.now()
  const cutoff = now - daysBack * 24 * 60 * 60 * 1000

  const featureLists = await Promise.all(states.map((s) => fetchAlertsForState(s.code)))
  const merged = new Map<string, HailEvent>()

  for (let i = 0; i < featureLists.length; i++) {
    const stateCode = states[i].code
    const region = states[i].region
    for (const feature of featureLists[i]) {
      const event = toHailEvent(feature, stateCode, region)
      if (!event) continue
      if (new Date(event.startsAt).getTime() < cutoff) continue
      const existing = merged.get(event.id)
      if (!existing || compareEventPriority(event, existing) < 0) {
        merged.set(event.id, event)
      }
    }
  }

  const sorted = [...merged.values()].sort(compareEventPriority)
  const cityFiltered = filterByCity(sorted, params.city)
  const limited = assignPriorityRanks(cityFiltered.slice(0, limit))

  requestCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: limited })

  return limited
}
