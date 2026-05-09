/** US regions for multi-state hail / storm lead search (NWS `area` = state code). */

export type UsRegionCode = "NE" | "SE" | "SW" | "NW" | "Central"

export const US_REGION_STATE_CODES: Record<UsRegionCode, string[]> = {
  NE: ["CT", "ME", "MA", "NH", "NJ", "NY", "PA", "RI", "VT"],
  SE: ["AL", "AR", "DE", "FL", "GA", "KY", "LA", "MD", "MS", "NC", "SC", "TN", "VA", "WV"],
  SW: ["AZ", "CA", "NV", "NM", "OK", "TX"],
  NW: ["ID", "MT", "OR", "WA", "WY"],
  Central: ["CO", "IA", "IL", "IN", "KS", "MI", "MN", "MO", "ND", "NE", "OH", "SD", "WI"],
}

export function parseRegionCode(value: string | null | undefined): UsRegionCode | undefined {
  if (!value?.trim()) return undefined
  const upper = value.trim().toUpperCase()
  if (upper === "CENTRAL") return "Central"
  if (upper === "NE" || upper === "SE" || upper === "SW" || upper === "NW") {
    return upper as UsRegionCode
  }
  return undefined
}
