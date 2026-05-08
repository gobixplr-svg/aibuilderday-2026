# Architecture

## What we're building

A measurement-and-estimate pipeline for residential pitched roofs:

```
address → aerial image → footprint + pitch → roof area → priced estimate
```

Five test properties. Submission is total sqft per address + a quote-ready PDF estimate per address.

## Stack (locked)

- **Next.js + Tailwind** — minimal app, mobile-friendly. Single page form: address in, results out.
- **Anthropic Claude (Sonnet 4.x)** — vision-based footprint and pitch analysis.
- **Anthropic Claude (Haiku 4.5)** — fast pre-classification (is this a residential pitched roof?).
- **Google Static Maps API** — aerial image acquisition (or Mapbox; whichever the spike picks).
- **Puppeteer or react-pdf** — quote PDF generation.
- **Supabase** *(optional)* — only if we want to persist results between runs. Not required for submission. CLI-only is fine.

## Pipeline

```
1. INPUT: address string
   ↓
2. GEOCODE: address → lat/lng
   - Google Geocoding API (or Mapbox Geocoding)
   ↓
3. AERIAL ACQUISITION: lat/lng → high-res overhead image
   - Google Static Maps (zoom 20, satellite, ~640×640 or 2048×2048 with scale=2)
   - Cache the image locally per address
   ↓
4. PITCH ESTIMATION: image → pitch (e.g. 6:12)
   - Claude vision call: "What is the dominant roof pitch?"
   - Heuristics: shadow length / direction, edge sharpness, visible elevation cues
   - Default to 6:12 if low confidence (most common residential)
   ↓
5. FOOTPRINT EXTRACTION: image + (optional) parcel polygon → footprint sqft
   - Claude vision call: "Outline the roof. Estimate footprint area in sqft using the scale bar."
   - Cross-check with parcel data when available
   ↓
6. ROOF AREA: footprint × pitch_multiplier
   - 4:12 → 1.054, 6:12 → 1.118, 8:12 → 1.202, etc.
   ↓
7. LINE ITEMS (best-effort): image → ridge/hip/valley/rake/eave linear-feet
   - Claude vision call: "Trace each ridge line. Estimate length in feet."
   - These are extras; total sqft is the primary signal.
   ↓
8. ESTIMATE: measurements + materials catalog → priced bid
   - Three material tiers (3-tab / architectural / premium)
   - Per-square material cost × roof area / 100
   - Labor hours × labor rate
   - Underlayment, drip edge, ridge cap as line items based on linear-feet measurements
   ↓
9. PDF: estimate → branded customer-ready PDF
   - Puppeteer renders an HTML template
   - Output to outputs/<slug>/estimate.pdf
```

## Why this shape

**Vision-first, not photogrammetry-first.** We don't have time to build a real photogrammetric pipeline (segment polygon, project to ground plane, integrate area). Claude vision can give us a credible estimate with a clear prompt. We're betting that "Claude looks at a satellite image and reasons about pitch + outline + scale" lands within ±10-15% of the references on most properties.

**Calibration loop is the real engineering work.** The 5 example properties have references. We run our pipeline against them, see how far off we are, iterate the prompt until we're consistently in range, then run the test set. That iteration loop is the meaningful engineering.

**No commercial measurement APIs.** Build, don't buy. The repo must show how we compute. EagleView's API is off-limits even if we had access.

**Single command line entry point.** `npm run estimate -- "address"` runs the whole pipeline and writes outputs. Judges can clone, run, see results.

## Data flow per property

```
inputs/
  (just the address string)
  ↓
intermediate/
  geocode.json      — lat/lng + formatted address
  aerial.jpg        — the satellite image we analyzed
  vision-pitch.json — Claude's pitch reasoning + final value
  vision-area.json  — Claude's footprint + line item reasoning
  ↓
outputs/<slug>/
  aerial.jpg        — copy of the analyzed image
  measurement.json  — final total_sqft, pitch, line items
  estimate.pdf      — branded customer-ready PDF
  notes.md          — anything notable (low confidence, tree cover, etc.)
```

## Vision prompts (sketch)

**Pitch prompt:**
```
SYSTEM: You are estimating the roof pitch of a residential
home from a satellite image. Pitch is expressed as rise:run
(e.g. 6:12, 8:12). Most US residential roofs are 4:12-12:12.

Look for: shadow length relative to building width, visible
elevation changes at the eaves, peak prominence in the image.

Return JSON: { "pitch": "6:12", "confidence": 0.0-1.0,
"rationale": "..." }
```

**Footprint + line items prompt:**
```
SYSTEM: You are estimating the roof footprint and line items
of a residential home from a satellite image.

The image is from Google Static Maps at zoom 20, scale=2.
At zoom 20, 1 pixel ≈ 0.15m at the equator (adjust for latitude).

Tasks:
1. Outline the roof footprint. Estimate area in square feet.
2. Trace the ridge lines. Sum their length in feet.
3. Trace the hip lines. Sum their length in feet.
4. Trace the valley lines. Sum their length in feet.
5. Trace the rake lines (gable edges). Sum their length in feet.
6. Trace the eave lines. Sum their length in feet.

Return JSON: {
  "footprint_sqft": number,
  "line_items": {
    "ridge": number,
    "hip": number,
    "valley": number,
    "rake": number,
    "eave": number
  },
  "confidence": 0.0-1.0,
  "rationale": "..."
}
```

These are starting points. We iterate against the example properties until calibrated.

## Materials catalog

Three tiers, real-ish prices. Stored as `data/materials.json`:

```json
{
  "tiers": [
    {
      "id": "standard",
      "name": "3-Tab Asphalt Shingle",
      "manufacturer_examples": ["GAF Royal Sovereign", "CertainTeed XT 25"],
      "warranty_years": 25,
      "cost_per_square": 110,
      "labor_hours_per_square": 1.5
    },
    {
      "id": "premium",
      "name": "Architectural Laminate",
      "manufacturer_examples": ["GAF Timberline HDZ", "CertainTeed Landmark", "Owens Corning Duration"],
      "warranty_years": 30,
      "cost_per_square": 145,
      "labor_hours_per_square": 2.0
    },
    {
      "id": "luxury",
      "name": "Designer / Impact-Resistant",
      "manufacturer_examples": ["GAF Camelot II", "CertainTeed Grand Manor", "Malarkey Vista"],
      "warranty_years": 50,
      "cost_per_square": 220,
      "labor_hours_per_square": 2.5
    }
  ],
  "accessories": {
    "underlayment_per_square": 25,
    "drip_edge_per_lf": 2.50,
    "ridge_cap_per_lf": 5.00,
    "ice_water_per_square": 65,
    "labor_rate_per_hour": 75
  }
}
```

## Submission shape

The repo at submission time:
- Public, working `npm run estimate` for any address
- `outputs/` populated for all 5 test properties
- README with stack notes and how-to-run
- Notes on AI choices and known limitations

The five sqft numbers go into the bounty form. PDFs go in `outputs/`.

## What we're NOT building

- Field photo capture
- Voice description
- Sales upsell agent
- Multi-trade support (windows etc. — drop entirely)
- Three-input fusion as a primary feature
- Permit / storm / parcel data fetching (parcel as cross-check is fine; permits and storms are out)
- Live phone-to-PDF demo flow
- Agent orchestra framing as the primary story

These were design directions before the bounty repo clarified the actual brief. They're now out of scope. If anything, we mention some of them as "future" in the README, but they don't get built.
