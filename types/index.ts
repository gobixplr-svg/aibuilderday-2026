export interface Measurement {
  slug: string
  address: string
  formatted_address: string
  lat: number
  lng: number
  pitch: string
  pitch_multiplier: number
  pitch_confidence: number
  pitch_rationale: string
  footprint_sqft: number
  footprint_confidence: number
  line_items: {
    ridge?: number
    hip?: number
    valley?: number
    rake?: number
    eave?: number
  }
  roof_area_sqft: number
  computed_at: string
}

export interface TierLine {
  label: string
  amount: number
}

export interface Tier {
  tier_id: string
  tier_name: string
  lines: TierLine[]
  subtotal: number
}

export interface EstimateResult {
  measurement: Measurement
  tiers: Tier[]
  generated_at: string
  stub?: boolean
}

export interface EstimateResponse {
  slug: string
  measurement: Measurement
  estimate: EstimateResult
  pdfPath?: string
}
