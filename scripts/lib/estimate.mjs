// Estimate adapter — bridges the measurement-pipeline output to Eric's
// estimate engine, producing the three-tier `{ tiers: [...] }` shape the
// PDF template expects.
//
// Architecture:
//   measurement (from Surveyor + Footprint agents)
//     → mapToEngineInput()                          [this file]
//     → calculateEstimate(input, pricing)           [Eric's estimate-engine.mjs]
//     → tier-by-tier loop, varying field cost       [this file]
//     → { tiers: [...], measurement, generated_at } [PDF input]
//
// We run Eric's engine 3x (once per tier) varying ONLY the field-shingle
// cost and labor-hours-per-square. All other math (waste factors, pitch
// bands, story/access/complexity multipliers, overhead, profit) is
// identical across tiers. Same engine, same inputs — three price points.

import { readFile, access } from "fs/promises"
import { join } from "path"
import { calculateEstimate } from "./estimate-engine.mjs"

const PRICING_DEFAULTS_PATH = join("data", "estimate-pricing-defaults.json")
const MATERIALS_PATH = join("data", "materials.json")

const FALLBACK_MATERIALS = {
  tiers: [
    { id: "standard", name: "3-Tab Asphalt Shingle", warranty_years: 25, cost_per_square: 110, labor_hours_per_square: 1.5 },
    { id: "premium", name: "Architectural Laminate", warranty_years: 30, cost_per_square: 145, labor_hours_per_square: 2.0 },
    { id: "luxury", name: "Designer / Impact-Resistant", warranty_years: 50, cost_per_square: 220, labor_hours_per_square: 2.5 },
  ],
  accessories: {},
}

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf-8"))
}

// Loads the materials catalog (Ethan's data/materials.json) plus the
// engine's base pricing profile (Eric's data/estimate-pricing-defaults.json).
// Falls back to in-file defaults if either is missing.
export async function loadMaterials() {
  let materials = FALLBACK_MATERIALS
  if (await exists(MATERIALS_PATH)) {
    materials = await readJson(MATERIALS_PATH)
  } else {
    console.log(`[estimate] ${MATERIALS_PATH} not present; using fallback catalog.`)
  }

  let pricing = null
  if (await exists(PRICING_DEFAULTS_PATH)) {
    pricing = await readJson(PRICING_DEFAULTS_PATH)
  } else {
    console.log(`[estimate] ${PRICING_DEFAULTS_PATH} not present; engine will use synthesized defaults.`)
  }

  return { materials, pricing }
}

// Convert the orchestrator's `measurement` object into the engine's `input`
// schema. Geometry comes straight from the vision pipeline. Counts default
// to typical residential values (the Surveyor doesn't extract these from
// aerial imagery — they'd require ground photos or homeowner intake).
// Conditions default to the median residential case; the homeowner-facing
// intake flow (Eric's docs/customer-intake-questions.md) is where these
// would be populated for real bids.
function mapToEngineInput(measurement) {
  const li = measurement.line_items || {}
  return {
    property: {
      address: measurement.address,
      formatted_address: measurement.formatted_address,
    },
    geometry: {
      roof_area_sqft: measurement.roof_area_sqft,
      ridge_lf: li.ridge ?? 0,
      hip_lf: li.hip ?? 0,
      valley_lf: li.valley ?? 0,
      eave_lf: li.eave ?? 0,
      rake_lf: li.rake ?? 0,
      sidewall_lf: 0,
    },
    counts: {
      penetrations: 5,
      skylights: 0,
      chimneys: 1,
      box_vents: 4,
      exhaust_vents: 2,
      access_hatches: 0,
    },
    conditions: {
      pitch: measurement.pitch || "6:12",
      stories: 1,
      tearoff_layers: 1,
      access_difficulty: "easy",
      complexity: "moderate",
      climate_requires_ice_water: false,
    },
  }
}

// Per-tier pricing override: change ONLY the field-shingle cost and the
// per-square labor hours. Eric's engine handles everything else.
function pricingForTier(basePricing, tier) {
  return {
    ...basePricing,
    costs: {
      ...basePricing.costs,
      field_cost_per_square: tier.cost_per_square,
    },
    labor: {
      ...basePricing.labor,
      base_hours_per_square: tier.labor_hours_per_square,
    },
  }
}

// Format the engine's output as a tier object the PDF can render.
// The PDF wants: { tier_id, tier_name, lines: [{label, amount}], subtotal }.
// We expand the engine's flat materials map into named line groupings
// that read cleanly on a homeowner-facing estimate.
function engineResultToTier(tier, result) {
  const c = result.costs
  const m = c.materials
  const q = result.quantities

  const lines = []

  // Field shingle (the biggest line, leads)
  const fieldSquares = q.field_squares
  lines.push({
    label: `${tier.name} (${fieldSquares} sq, includes ${(100 * (fieldSquares / q.roof_squares - 1)).toFixed(0)}% waste)`,
    amount: m.field,
  })

  // Tear-off
  if (m.tearoff > 0) {
    lines.push({
      label: `Tear-off (${q.roof_squares} sq, ${result.inputs.conditions.tearoff_layers} layer)`,
      amount: m.tearoff,
    })
  }

  // Underlayment + ice & water
  if (m.underlayment > 0) {
    lines.push({ label: `Underlayment (${q.underlayment_squares} sq)`, amount: m.underlayment })
  }
  if (m.ice_water > 0) {
    lines.push({ label: `Ice & water shield (${q.ice_water_squares} sq)`, amount: m.ice_water })
  }

  // Edge metal — combined ridge/hip/valley/drip/rake into "trim & flashing"
  const trimTotal =
    (m.ridge_cap || 0) +
    (m.hip_cap || 0) +
    (m.valley_metal || 0) +
    (m.drip_edge_eave || 0) +
    (m.rake_trim || 0)
  if (trimTotal > 0) {
    const eaveLf = q.eave_lf
    const ridgeLf = q.ridge_lf
    lines.push({
      label: `Trim & flashing (drip edge ${eaveLf} lf, ridge ${ridgeLf} lf, valley ${q.valley_lf} lf)`,
      amount: round(trimTotal),
    })
  }

  // Penetration / vent / chimney accessories
  const accTotal =
    (m.penetration_boots || 0) +
    (m.skylight_flashing || 0) +
    (m.chimney_flashing || 0) +
    (m.box_vents || 0) +
    (m.exhaust_vents || 0) +
    (m.access_hatches || 0) +
    (m.step_flashing || 0) +
    (m.sidewall_flashing || 0)
  if (accTotal > 0) {
    lines.push({
      label: `Penetrations & vents (boots, chimney, ridge vents)`,
      amount: round(accTotal),
    })
  }

  // Decking allowance
  if (m.decking_sheets > 0) {
    lines.push({
      label: `Decking allowance (${q.decking_sheets} sheets, ${(100 * (m.decking_sheets / c.direct_material_cost) || 0).toFixed(0) ? "" : ""}contingency)`,
      amount: m.decking_sheets,
    })
  }

  // Labor (single line)
  lines.push({
    label: `Labor (${q.roof_squares} sq @ ${q.roof_squares > 0 ? (c.labor_hours_adjusted / q.roof_squares).toFixed(2) : "—"} h/sq)`,
    amount: c.direct_labor_cost,
  })

  // Overhead + profit
  if (c.overhead > 0) {
    lines.push({
      label: `Overhead (${(100 * result.multipliers.overhead_pct).toFixed(0)}%)`,
      amount: c.overhead,
    })
  }
  if (c.profit > 0) {
    lines.push({
      label: `Profit (${(100 * result.multipliers.profit_pct).toFixed(0)}%)`,
      amount: c.profit,
    })
  }

  return {
    tier_id: tier.id,
    tier_name: tier.name,
    lines: lines.map((l) => ({ ...l, amount: round(l.amount) })),
    subtotal: round(c.grand_total),
    engine_output: result, // keep full engine output for debugging/inspection
  }
}

// Public API used by scripts/estimate.mjs orchestrator
export async function buildEstimate({ measurement, materials }) {
  // Load Eric's pricing profile if available; fall back to synthesizing one
  // from the simpler materials catalog if not.
  let pricing
  try {
    pricing = await readJson(PRICING_DEFAULTS_PATH)
  } catch {
    console.log(`[estimate] couldn't load ${PRICING_DEFAULTS_PATH}; synthesizing pricing from materials catalog.`)
    pricing = synthesizePricing(materials)
  }

  const input = mapToEngineInput(measurement)
  const tiers = (materials?.tiers ?? FALLBACK_MATERIALS.tiers).map((tier) => {
    const tierPricing = pricingForTier(pricing, tier)
    const result = calculateEstimate(input, tierPricing)
    return engineResultToTier(tier, result)
  })

  return {
    measurement,
    tiers,
    generated_at: new Date().toISOString(),
    engine: { name: "estimate-engine", version: "0.1.0" },
  }
}

// If estimate-pricing-defaults.json is missing, synthesize a minimal
// pricing profile from materials.json so the engine still runs.
function synthesizePricing(materials) {
  const acc = materials?.accessories ?? {}
  return {
    currency: "USD",
    field_waste_pct: 0.12,
    underlayment_waste_pct: 0.05,
    ice_water_waste_pct: 0.05,
    decking_allowance_pct: 0.07,
    decking_sheet_sqft: 32,
    costs: {
      field_cost_per_square: 145, // overridden per tier
      underlayment_cost_per_square: acc.underlayment_per_square ?? 25,
      ice_water_cost_per_square: acc.ice_water_per_square ?? 65,
      tearoff_cost_per_square_per_layer: 35,
      ridge_cap_cost_per_lf: acc.ridge_cap_per_lf ?? 5,
      hip_cap_cost_per_lf: 5,
      valley_metal_cost_per_lf: 7,
      drip_edge_cost_per_lf: acc.drip_edge_per_lf ?? 2.5,
      rake_trim_cost_per_lf: 2.5,
      sidewall_flashing_cost_per_lf: 6,
      step_flashing_cost_each: 4,
      penetration_boot_cost_each: 28,
      skylight_flashing_cost_each: 140,
      chimney_flashing_cost_each: 220,
      box_vent_cost_each: 55,
      exhaust_vent_cost_each: 45,
      access_hatch_flash_cost_each: 180,
      decking_sheet_cost_each: 55,
    },
    labor: {
      base_hours_per_square: 2.0, // overridden per tier
      ridge_hours_per_100_lf: 4,
      valley_hours_per_100_lf: 6,
      flashing_hours_per_100_lf: 5,
      count_item_hours_each: { penetration: 0.3, skylight: 1.8, chimney: 2.5, box_vent: 0.35, exhaust_vent: 0.35, access_hatch: 1.2 },
      labor_rate_per_hour: acc.labor_rate_per_hour ?? 85,
    },
    multipliers: {
      pitch_band: { "4:12_and_under": 1, "5_to_7": 1.1, "8_to_10": 1.22, "10_plus": 1.35 },
      stories: { "1": 1, "2": 1.12, "3": 1.25 },
      access: { easy: 1, moderate: 1.08, difficult: 1.18 },
      complexity: { simple: 1, moderate: 1.1, complex: 1.22 },
      overhead_pct: 0.12,
      profit_pct: 0.15,
    },
  }
}

function round(n) {
  return Math.round(n * 100) / 100
}
