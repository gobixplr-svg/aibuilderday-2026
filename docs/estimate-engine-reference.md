# Re-Roof Estimate Engine Reference

This document captures the factor model we use for residential re-roof estimation.

## Core Model

The engine is structured in three quantity layers plus multipliers:

1. **Area-based items** (surface coverage)
2. **Linear-foot items** (edges and intersections)
3. **Count-based items** (penetrations/accessories)
4. **Multipliers** (waste, difficulty, overhead, profit)

## 1) Area-Based Components

Driven by total roof surface area (post-pitch factor).

- Field roofing (shingles/metal/tile)
  - `field_squares = (roof_area_sqft / 100) * (1 + field_waste_pct)`
- Underlayment (synthetic/felt/peel-and-stick base)
- Ice & water shield by area (climate/low-slope conditional)
- Decking replacement allowance (percent of roof area or fixed sheet count)

## 2) Linear-Foot Components

Driven by measured roof geometry.

- Ridge LF
- Hip LF
- Valley LF
- Eave LF
- Rake LF
- Sidewall/headwall flashing LF
- Step flashing (often derived from sidewall LF)

## 3) Count-Based Components

Per-item components.

- Penetrations (plumbing vent, flue, B-vent, etc.)
- Skylights/roof windows
- Chimneys
- Attic vents (box/turbine/power)
- Roof-terminated exhaust vents
- Access hatches

## 4) Structural/Conditional Components

- Decking repair/replacement (per sheet)
- Framing adjustments (cricket, reinforcement)
- Optional insulation adjustments at access/eaves

## 5) Labor & Business Factors

Applied to direct-cost baseline.

- Tear-off (per square, layer-adjusted)
- Steepness factor (by pitch band)
- Height/access factor (stories, logistics)
- Complexity factor (valleys, dormers, transitions)
- Overhead percent
- Profit percent

## Input Contract (Engine)

- Geometry:
  - `roof_area_sqft` (or derivable via footprint + pitch multiplier)
  - `ridge_lf`, `hip_lf`, `valley_lf`, `eave_lf`, `rake_lf`, `sidewall_lf`
- Counts:
  - `penetrations`, `skylights`, `chimneys`, `box_vents`, `exhaust_vents`, `access_hatches`
- Conditions:
  - `pitch`, `stories`, `tearoff_layers`, `climate_requires_ice_water`, `access_difficulty`, `complexity`

## Output Contract (Engine)

- Quantity breakdown:
  - material units (squares, LF, counts, sheets)
- Labor breakdown:
  - labor hours and labor cost, with difficulty multipliers
- Financial breakdown:
  - direct material cost
  - direct labor cost
  - subtotal direct cost
  - overhead
  - profit
  - final total
