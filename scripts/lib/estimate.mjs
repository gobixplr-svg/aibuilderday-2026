// Estimate calculator — STUB.
// Real implementation lands as task #6 (depends on #5 catalog).
// Until then, returns a minimal pricing structure so #8 can run.

import { readFile, access } from "fs/promises"
import { join } from "path"

const FALLBACK_MATERIALS = {
  tiers: [
    {
      id: "standard",
      name: "3-Tab Asphalt Shingle (stub)",
      cost_per_square: 110,
      labor_hours_per_square: 1.5,
    },
    {
      id: "premium",
      name: "Architectural Laminate (stub)",
      cost_per_square: 145,
      labor_hours_per_square: 2.0,
    },
    {
      id: "luxury",
      name: "Designer / Impact-Resistant (stub)",
      cost_per_square: 220,
      labor_hours_per_square: 2.5,
    },
  ],
  accessories: {
    underlayment_per_square: 25,
    drip_edge_per_lf: 2.5,
    ridge_cap_per_lf: 5.0,
    ice_water_per_square: 65,
    labor_rate_per_hour: 75,
  },
}

export async function loadMaterials() {
  const path = join("data", "materials.json")
  try {
    await access(path)
    const txt = await readFile(path, "utf-8")
    return JSON.parse(txt)
  } catch {
    console.log(`[estimate] data/materials.json not present; using stub catalog. Real catalog lands in task #5.`)
    return FALLBACK_MATERIALS
  }
}

// roof_area_sqft + line_items → bid for each tier
export async function buildEstimate({ measurement, materials }) {
  const squares = measurement.roof_area_sqft / 100
  const lineItems = measurement.line_items || {}
  const acc = materials.accessories

  const tiers = materials.tiers.map((tier) => {
    const materialCost = squares * tier.cost_per_square
    const laborCost = squares * tier.labor_hours_per_square * acc.labor_rate_per_hour
    const underlayment = squares * acc.underlayment_per_square
    const dripEdge = (lineItems.eave || 0) * acc.drip_edge_per_lf
    const ridgeCap = ((lineItems.ridge || 0) + (lineItems.hip || 0)) * acc.ridge_cap_per_lf
    const subtotal = materialCost + laborCost + underlayment + dripEdge + ridgeCap
    return {
      tier_id: tier.id,
      tier_name: tier.name,
      lines: [
        { label: `${tier.name} (${squares.toFixed(2)} sq)`, amount: round(materialCost) },
        { label: `Labor (${squares.toFixed(2)} sq × ${tier.labor_hours_per_square}h × $${acc.labor_rate_per_hour}/h)`, amount: round(laborCost) },
        { label: `Underlayment (${squares.toFixed(2)} sq)`, amount: round(underlayment) },
        { label: `Drip edge (${lineItems.eave || 0} lf)`, amount: round(dripEdge) },
        { label: `Ridge cap (${(lineItems.ridge || 0) + (lineItems.hip || 0)} lf)`, amount: round(ridgeCap) },
      ],
      subtotal: round(subtotal),
    }
  })

  return {
    measurement,
    tiers,
    generated_at: new Date().toISOString(),
    stub: true, // remove when real estimate calc lands in #6
  }
}

function round(n) {
  return Math.round(n * 100) / 100
}
