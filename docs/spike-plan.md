# Spike Plan — First 60 Minutes at the Event

> Goal: validate the architecture's two riskiest assumptions before committing to the build. If either spike comes back red, we know early enough to redesign.

## The two riskiest assumptions

1. **Vision-call latency fits in the budget.** The whole demo lives or dies on Claude Sonnet vision returning structured items in under 25s on 3-5 photos with a real prompt. We assume yes; we haven't measured.
2. **External context sources are reachable and useful.** Satellite, parcel, permits, storms — we assume they return useful data inside 5s per source. Some county/permit endpoints are slow or rate-limited. We don't know which work for Lehi addresses.

If either fails, the architecture flexes. Better to know in the first hour than the last.

## Two parallel spikes, 45 minutes each

### Spike A — Vision Latency (Dan or Will)

**Question:** Can Claude Sonnet vision return structured items from 3 photos + a description + a system prompt in <25 seconds, repeatably?

**Setup (5 min):**
- Three test photos:
  - 1 stock photo of a residential window (Unsplash)
  - 1 stock photo of a roof (Unsplash)
  - 1 Google Street View screenshot of a real Lehi address
- A real-shaped extraction prompt (~1500 tokens system + ~300 tokens user) — see template below
- Anthropic SDK + a stopwatch wrapper

**Run (20 min):**
- 5 trial runs per photo set, measure: API call latency, tokens used, output quality (does it return parseable JSON with sensible items?)
- Test variations:
  - Sonnet 4.x (default)
  - Haiku 4.5 (fallback)
  - 1 photo vs 3 photos
  - With description vs without
  - 1024px images vs 2048px

**Decision (20 min):**
- If median Sonnet latency <20s with 3 photos → proceed with default
- If 20-30s → consider parallel calls or image downscale
- If >30s → fall back to Haiku for vision, accept lower fidelity
- Document the chosen settings in `architecture.md`

**Prompt template:**
```
SYSTEM: You are extracting a contractor estimate scope from
property signals. The description is the primary observation;
photos verify and add detail. Return JSON conforming to:
{
  "items": [{
    "type": "window" | "door" | "roof_area",
    "description": string,
    "qty": int,
    "dimensions": {"w": number, "h": number, "unit": "in"} | null,
    "condition": "new" | "good" | "worn" | "damaged",
    "confidence": 0.0-1.0,
    "rationale": string
  }]
}

USER:
  Description: "{description}"
  Photos: [attached]
  Trade pack: windows
  Return only valid JSON.
```

### Spike B — External Context Sources (Eric)

**Question:** Which external data sources return useful data on a real Lehi address within 5 seconds, and which are slow/broken/useless?

**Setup (5 min):**
- Pick a real Lehi address. JobNimbus HQ (3451 N Triumph Blvd, Lehi UT 84043) is a defensible choice — meta to use it as the demo property too.
- A small Node script that hits each candidate API with a stopwatch.

**Run (25 min):**
Test each source. For each: latency, success/fail, data shape, useful for an estimate?

| Source | Endpoint | What we want |
|---|---|---|
| Google Static Maps | `maps.googleapis.com/maps/api/staticmap` | Aerial image URL |
| Mapbox Static | `api.mapbox.com/styles/v1/.../static/...` | Aerial image URL |
| Utah County GIS | varies — search "Utah County parcel REST API" | Parcel polygon, sqft, year built |
| Utah State GIS | `gis.utah.gov` services | Statewide parcel data |
| NOAA Storm Events | `ncei.noaa.gov/access/services/data/v1` | Storms in the area, last 5 years |
| Utah permits | research at event — try Lehi city open data | Recent permits on this address |
| OpenStreetMap | Overpass API | Building footprint, height |
| Regrid | regrid.com (paid) | Parcel data (skip if not free) |

**Decision (15 min):**
- Top 3 fastest + most useful sources go into the worker as adapters
- Others get noted as "future" in `architecture.md`
- If <2 sources work, the demo de-emphasizes external context and leans harder on photos + description (architecture still holds, story shifts)

## Spike output: a 5-line decision doc

After the two spikes, write a quick decision capture in `docs/spike-results.md`:

```markdown
# Spike Results

- Vision model: Sonnet | Haiku  (median latency: __s on 3 photos)
- Image size: __px
- External sources kept: [list]
- External sources dropped: [list with reasons]
- Architecture changes vs original plan: [if any]
- Confidence in <60s end-to-end: high | medium | low
```

That doc replaces this one. The team aligns to it before the build starts in earnest.

## Anti-spikes (things NOT to spend the first hour on)

- ❌ Picking a specific PDF template style — that's Track C, save it for Saturday morning
- ❌ Setting up auth — no auth in the demo, skip
- ❌ Designing the catalog schema in detail — JSONB blob, iterate
- ❌ Long discussions about framework choice — Next.js + Supabase, move on
- ❌ Trying to integrate JobNimbus's real API — out of scope, mock it

## After the spikes

If both come back green:
- Lock the architecture
- Eric: scaffold the Next.js app + Supabase schema
- Dan + Will: lock the prompt, set up worker skeleton
- Ethan: start catalog research and PDF template design

If either comes back red:
- Stop. Group huddle. Redesign the affected layer.
- Then proceed.
