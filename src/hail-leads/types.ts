import type { UsRegionCode } from "@/src/hail-leads/server/regions"

export type EventSeverity = "minor" | "moderate" | "severe" | "extreme"

export type HailEvent = {
  id: string
  title: string
  /** Primary state for this row (NWS query state or first in merged region search). */
  state: string
  /** When searching by US region, which region was used. */
  queryRegion?: string
  city?: string
  areaDescription: string
  startsAt: string
  endsAt?: string
  /** Max inferred hail diameter in inches (2 decimal precision from text). */
  hailSizeInches?: number
  /** Peak wind speed in mph from alert text (gust or sustained, whichever is higher). */
  windGustMph?: number
  severity: EventSeverity
  severityScore: number
  recencyScore: number
  leadPriorityScore: number
  source: "nws"
  sourceUrl: string
  summary: string
}

export type LeadType = "existing_customer" | "prospect"

export type ContractorLead = {
  id: string
  name: string
  leadType: LeadType
  city?: string
  state?: string
  phone?: string
  /** Rare in public APIs (Yelp/Google omit); often from OSM tags or seed JSON. */
  email?: string
  website?: string
  address?: string
  lat?: number
  lng?: number
  source: string
}

export type ScoredContractorLead = ContractorLead & {
  score: number
  scoreReasons: string[]
  contactability: "high" | "medium" | "low"
}

export type HailSearchParams = {
  state?: string
  region?: UsRegionCode
  city?: string
  daysBack?: number
  limit?: number
}
