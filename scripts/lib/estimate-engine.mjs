const roundMoney = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const roundQty = (n, digits = 2) => Math.round((n + Number.EPSILON) * 10 ** digits) / 10 ** digits

function parsePitchRise(pitch) {
  if (!pitch || typeof pitch !== "string") return 6
  const [rise] = pitch.split(":")
  const value = Number(rise)
  return Number.isFinite(value) ? value : 6
}

function pitchBandKey(rise) {
  if (rise <= 4) return "4:12_and_under"
  if (rise <= 7) return "5_to_7"
  if (rise <= 10) return "8_to_10"
  return "10_plus"
}

function safeNum(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function calculateEstimate(input, pricing) {
  const geometry = input.geometry ?? {}
  const counts = input.counts ?? {}
  const conditions = input.conditions ?? {}

  const roofAreaSqft = safeNum(geometry.roof_area_sqft)
  const roofSquares = roofAreaSqft / 100

  const ridgeLf = safeNum(geometry.ridge_lf)
  const hipLf = safeNum(geometry.hip_lf)
  const valleyLf = safeNum(geometry.valley_lf)
  const eaveLf = safeNum(geometry.eave_lf)
  const rakeLf = safeNum(geometry.rake_lf)
  const sidewallLf = safeNum(geometry.sidewall_lf)

  const penetrations = safeNum(counts.penetrations)
  const skylights = safeNum(counts.skylights)
  const chimneys = safeNum(counts.chimneys)
  const boxVents = safeNum(counts.box_vents)
  const exhaustVents = safeNum(counts.exhaust_vents)
  const accessHatches = safeNum(counts.access_hatches)

  const pitchRise = parsePitchRise(conditions.pitch)
  const pitchMultiplier = pricing.multipliers.pitch_band[pitchBandKey(pitchRise)] ?? 1
  const storiesMultiplier = pricing.multipliers.stories[String(conditions.stories ?? 1)] ?? 1
  const accessMultiplier = pricing.multipliers.access[conditions.access_difficulty ?? "easy"] ?? 1
  const complexityMultiplier = pricing.multipliers.complexity[conditions.complexity ?? "simple"] ?? 1
  const laborDifficultyMultiplier = pitchMultiplier * storiesMultiplier * accessMultiplier * complexityMultiplier

  const fieldSquares = roofSquares * (1 + pricing.field_waste_pct)
  const underlaymentSquares = roofSquares * (1 + pricing.underlayment_waste_pct)
  const iceWaterSquares = conditions.climate_requires_ice_water
    ? roofSquares * (1 + pricing.ice_water_waste_pct)
    : 0
  const deckingAreaSqft = roofAreaSqft * pricing.decking_allowance_pct
  const deckingSheets = deckingAreaSqft / pricing.decking_sheet_sqft
  const stepFlashingCount = sidewallLf > 0 ? Math.ceil(sidewallLf / 1) : 0

  const tearoffLayers = Math.max(1, safeNum(conditions.tearoff_layers, 1))

  const materialCosts = {
    field: fieldSquares * pricing.costs.field_cost_per_square,
    underlayment: underlaymentSquares * pricing.costs.underlayment_cost_per_square,
    ice_water: iceWaterSquares * pricing.costs.ice_water_cost_per_square,
    tearoff: roofSquares * tearoffLayers * pricing.costs.tearoff_cost_per_square_per_layer,
    ridge_cap: ridgeLf * pricing.costs.ridge_cap_cost_per_lf,
    hip_cap: hipLf * pricing.costs.hip_cap_cost_per_lf,
    valley_metal: valleyLf * pricing.costs.valley_metal_cost_per_lf,
    drip_edge_eave: eaveLf * pricing.costs.drip_edge_cost_per_lf,
    rake_trim: rakeLf * pricing.costs.rake_trim_cost_per_lf,
    sidewall_flashing: sidewallLf * pricing.costs.sidewall_flashing_cost_per_lf,
    step_flashing: stepFlashingCount * pricing.costs.step_flashing_cost_each,
    penetration_boots: penetrations * pricing.costs.penetration_boot_cost_each,
    skylight_flashing: skylights * pricing.costs.skylight_flashing_cost_each,
    chimney_flashing: chimneys * pricing.costs.chimney_flashing_cost_each,
    box_vents: boxVents * pricing.costs.box_vent_cost_each,
    exhaust_vents: exhaustVents * pricing.costs.exhaust_vent_cost_each,
    access_hatches: accessHatches * pricing.costs.access_hatch_flash_cost_each,
    decking_sheets: deckingSheets * pricing.costs.decking_sheet_cost_each
  }

  const directMaterialCost = Object.values(materialCosts).reduce((sum, v) => sum + v, 0)

  const laborHoursBase =
    roofSquares * pricing.labor.base_hours_per_square +
    (ridgeLf / 100) * pricing.labor.ridge_hours_per_100_lf +
    (valleyLf / 100) * pricing.labor.valley_hours_per_100_lf +
    (sidewallLf / 100) * pricing.labor.flashing_hours_per_100_lf +
    penetrations * pricing.labor.count_item_hours_each.penetration +
    skylights * pricing.labor.count_item_hours_each.skylight +
    chimneys * pricing.labor.count_item_hours_each.chimney +
    boxVents * pricing.labor.count_item_hours_each.box_vent +
    exhaustVents * pricing.labor.count_item_hours_each.exhaust_vent +
    accessHatches * pricing.labor.count_item_hours_each.access_hatch

  const laborHoursAdjusted = laborHoursBase * laborDifficultyMultiplier
  const directLaborCost = laborHoursAdjusted * pricing.labor.labor_rate_per_hour

  const directCost = directMaterialCost + directLaborCost
  const overhead = directCost * pricing.multipliers.overhead_pct
  const subtotalWithOverhead = directCost + overhead
  const profit = subtotalWithOverhead * pricing.multipliers.profit_pct
  const grandTotal = subtotalWithOverhead + profit

  return {
    metadata: {
      version: "0.1.0",
      generated_at: new Date().toISOString(),
      currency: pricing.currency ?? "USD"
    },
    inputs: input,
    quantities: {
      roof_area_sqft: roundQty(roofAreaSqft),
      roof_squares: roundQty(roofSquares),
      field_squares: roundQty(fieldSquares),
      underlayment_squares: roundQty(underlaymentSquares),
      ice_water_squares: roundQty(iceWaterSquares),
      decking_sheets: roundQty(deckingSheets),
      ridge_lf: roundQty(ridgeLf),
      hip_lf: roundQty(hipLf),
      valley_lf: roundQty(valleyLf),
      eave_lf: roundQty(eaveLf),
      rake_lf: roundQty(rakeLf),
      sidewall_lf: roundQty(sidewallLf),
      step_flashing_count: stepFlashingCount,
      penetrations,
      skylights,
      chimneys,
      box_vents: boxVents,
      exhaust_vents: exhaustVents,
      access_hatches: accessHatches
    },
    multipliers: {
      pitch: roundQty(pitchMultiplier, 3),
      stories: roundQty(storiesMultiplier, 3),
      access: roundQty(accessMultiplier, 3),
      complexity: roundQty(complexityMultiplier, 3),
      labor_difficulty_total: roundQty(laborDifficultyMultiplier, 3),
      overhead_pct: pricing.multipliers.overhead_pct,
      profit_pct: pricing.multipliers.profit_pct
    },
    costs: {
      materials: Object.fromEntries(
        Object.entries(materialCosts).map(([k, v]) => [k, roundMoney(v)])
      ),
      direct_material_cost: roundMoney(directMaterialCost),
      labor_hours_base: roundQty(laborHoursBase),
      labor_hours_adjusted: roundQty(laborHoursAdjusted),
      direct_labor_cost: roundMoney(directLaborCost),
      direct_cost: roundMoney(directCost),
      overhead: roundMoney(overhead),
      profit: roundMoney(profit),
      grand_total: roundMoney(grandTotal)
    }
  }
}
