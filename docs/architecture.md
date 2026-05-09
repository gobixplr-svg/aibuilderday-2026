# Architecture

## What we're building

A measurement-and-estimate pipeline for residential pitched roofs:

```
address → geocode → aerial → (Solar subject + sanity data) → vision footprint & line items
  → Solar pitch (primary) + vision pitch (fallback) → roof area (+ optional Solar fence)
  → condition assessment → priced 3-tier estimate → PDF
```

Five test properties for submission: total **roof** sqft per address plus a quote-ready PDF. Calibration uses five example properties with published reference measurements.

## Stack (as implemented)

- **Next.js + Tailwind** — Roof Recon UI (`/`), demo pitch page (`/pitch`), hail-leads (`/hail-leads`). API routes under `app/api/`.
- **Anthropic Claude Sonnet 4.6** — vision calls for footprint + line items, vision pitch (fallback), and roof **condition** (pre-inspection observations). Single model id in [`scripts/lib/claude.mjs`](scripts/lib/claude.mjs).
- **Google Maps Platform** — **Geocoding**, **Maps Static API** (satellite, zoom 20, `size=640` `scale=2` → **1280×1280** effective px), and **Solar API** `buildingInsights:findClosest` (subject polygon, per-segment pitch and slope-corrected areas). Implementation: [`scripts/lib/geocode.mjs`](scripts/lib/geocode.mjs), [`scripts/lib/aerial.mjs`](scripts/lib/aerial.mjs), [`scripts/lib/solar-api.mjs`](scripts/lib/solar-api.mjs).
- **Free fallback path** — no Google key: Census/Nominatim geocode + Esri World Imagery, no Solar (subject box + fence + solar pitch unavailable). [`scripts/lib/aerial-free.mjs`](scripts/lib/aerial-free.mjs).
- **Puppeteer** — branded estimate PDF from HTML template. [`scripts/lib/pdf.mjs`](scripts/lib/pdf.mjs), [`scripts/lib/pdf-template.mjs`](scripts/lib/pdf-template.mjs).
- **No database** — results are files under `intermediate/` and `outputs/` only.

## Pipeline (production path, Google key present)

```
1. INPUT: address string
   ↓
2. GEOCODE: Google Geocoding → lat/lng (+ formatted address, location type)
   → intermediate/<slug>/geocode.json
   ↓
3. AERIAL: Google Static Maps satellite, zoom 20, 1280 px effective
   → intermediate/<slug>/aerial.jpg, meta.json (feet_per_pixel, etc.)
   ↓
4. ANNOTATE (scale bar + north arrow): first pass may run before vision;
   footprint step re-annotates with Solar subject marker when insights exist
   → intermediate/<slug>/aerial-annotated.jpg
   ↓
5. SOLAR API: buildingInsights for lat/lng (cached)
   → intermediate/<slug>/solar-insights.json
   Footprint step ensures fetch + overlay: orange SUBJECT box + reticle on the subject building
   (see scripts/lib/scale-bar.mjs + scripts/lib/footprint.mjs).
   ↓
6. VISION (parallel where safe):
   - Footprint + line items (ridge/hip/valley/rake/eave LF) on SUBJECT-annotated image
     → intermediate/<slug>/vision-area.json
   - Vision pitch on annotated image (logged; used when Solar pitch unavailable)
     → intermediate/<slug>/vision-pitch.json
   ↓
7. SOLAR PITCH (primary): area-weighted roofSegmentStats[].pitchDegrees → x:12 enum
   → merged in scripts/estimate.mjs; fallback to vision when no/low-quality Solar coverage
   (scripts/lib/solar-pitch.mjs)
   ↓
8. CONDITION (serial after footprint): third Sonnet call on same annotated image
   → intermediate/<slug>/vision-condition.json (PLOG-008)
   ↓
9. ROOF AREA:
   - Default: vision_footprint_sqft × pitch_multiplier (from primary pitch)
   - Solar fence: if |vision_roof_area − solar_slope_corrected_sum| / solar > 12%,
     adopt Solar’s slope-corrected segment-area sum (shared threshold in scripts/lib/fence.mjs)
   ↓
10. ESTIMATE: materials catalog + pure-function engine
    → outputs/<slug>/estimate.json (scripts/lib/estimate-engine.mjs via scripts/lib/estimate.mjs)
   ↓
11. PDF: Puppeteer render (includes aerial, tiers, pre-inspection observations)
    → outputs/<slug>/estimate.pdf
```

**Entry points:** `node scripts/estimate.mjs "<address>"` and the web UI (`/api/measure` spawns the same pipeline). **`npm run calibrate`** replays cached intermediates for the five example properties.

## Why this shape

**Solar API for subject + sanity, not “buy measurement.”** Dense suburbs break naive “one tile → one LLM”: many roofs per image. Solar returns the **subject building** geometry; we draw that on the tile and instruct vision to measure only inside the orange box. Separately, summed **slope-corrected** segment areas give an independent roof-area check. Vision still computes footprint and line items; composition (vision × pitch, fence when disagreement exceeds threshold) is implemented in-repo.

**Calibration loop.** The five example properties anchor prompt and threshold choices; changes are logged in [`docs/prompt-changelog.md`](docs/prompt-changelog.md) (PLOG-001 onward, including reverts).

**No commercial roof measurement APIs** (EagleView, Hover, Roofr instant products, etc.). See repo grep / [`JUDGES.md`](../JUDGES.md) hard-rules table.

## Data flow per property

```
intermediate/<slug>/
  geocode.json           — lat/lng + formatted address
  meta.json              — zoom, feet_per_pixel, imagery metadata
  aerial.jpg             — raw Static Maps (or Esri) tile
  solar-insights.json    — full Solar buildingInsights payload (cached)
  aerial-annotated.jpg   — scale bar + north (+ SUBJECT overlay when Solar succeeded)
  vision-pitch.json      — vision pitch (always produced when path runs)
  vision-area.json       — footprint + line items + rationale
  vision-condition.json  — structured condition + findings (PLOG-008)

outputs/<slug>/
  measurement.json       — final sqft, pitch, sources (vision vs solar-fence, pitch_source)
  estimate.json          — three priced tiers + line math
  estimate.pdf           — customer-facing PDF
  aerial.jpg             — copy of raw aerial for self-contained bundle
```

`notes.md` in outputs is not written by the current CLI; optional manual notes only.

## Vision prompts

Authoritative prompts live next to the tools:

- **Footprint + line items:** [`scripts/lib/footprint.mjs`](scripts/lib/footprint.mjs) — system template includes optional SUBJECT-marker instructions when `buildingInsights` is present.
- **Vision pitch:** [`scripts/lib/pitch.mjs`](scripts/lib/pitch.mjs) — fallback path; primary pitch is Solar in [`scripts/lib/solar-pitch.mjs`](scripts/lib/solar-pitch.mjs).
- **Condition:** [`scripts/lib/condition.mjs`](scripts/lib/condition.mjs) — structured assessment, empty findings allowed, no hedging / no fabrication framing.

## Materials catalog

Real per-tier and accessory numbers in [`data/materials.json`](../data/materials.json) (Standard / Premium / Luxury tiers; labor rate and line-item drivers for drip edge, ridge cap, underlayment, etc.).

## Adjacent product: hail-driven leads (`/hail-leads`)

**Not part of the measurement math.** A separate Next.js feature: NWS alerts, contractor discovery (e.g. Yelp + OSM), CSV/PDF export. Lives under `src/hail-leads/`, `app/(hail-leads)/`, `app/api/hail-leads/`. See [`docs/hail-leads.md`](hail-leads.md).

## Submission shape

- Public repo with working `npm run estimate` (and documented env: `ANTHROPIC_API_KEY`, `GOOGLE_MAPS_API_KEY` with Geocoding + Static + Solar).
- `outputs/` populated for test (and example) properties as submitted.
- Evidence-oriented summary for judges: [`JUDGES.md`](../JUDGES.md).
- Same-day operational detail: [`docs/end-to-end.md`](end-to-end.md).

## What we're NOT building (core bounty scope)

- Field photo capture, voice intake, or multi-trade estimates in the main pipeline.
- Commercial measurement APIs as the source of truth.
- **Live hail “damage detection”** on the aerial — condition output is **pre-inspection observations** only, not a storm-damage diagnosis.

Storm **alerting** and contractor lead lists are intentionally **out of the measurement path** but exist as the optional hail-leads module above.

## Related documentation

- [`CLAUDE.md`](../CLAUDE.md) — team rules, env vars, how to run.
- [`docs/prompt-changelog.md`](prompt-changelog.md) — PLOG iteration history.
- [`docs/end-to-end.md`](end-to-end.md) — submission checklist and playbook.
