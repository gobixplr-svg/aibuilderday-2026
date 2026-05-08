# Architecture

> Working draft. This locks the shape; specific tech choices inside each box can flex.

## Framing: agent orchestra, not "a vision pipeline"

We orchestrate a small set of specialized AI agents across the estimate workflow. Same underlying calls, sharper story — and closer to where JobNimbus is already heading with Scout. The agents in v1:

- **Surveyor** — fuses photos + description + external context into structured scope items
- **Estimator** — matches scope items to the trade-pack catalog and prices the job
- **Generator** — renders the branded, customer-ready estimate PDF
- **Sales** — after the estimate renders, suggests one contextual upsell (e.g. "noticed an old gutter — add gutter replacement?")

Future agents (post-v1, kept visible to show the platform thesis): **Validator** (sanity-checks against historical/benchmark data), **Communicator** (email/SMS the estimate), **Follow-up** (re-engages the customer), **Metric Analyzer** (closes the conversion-rate loop).

The architecture below is what these agents run on.

## Three-input fusion, async pipeline

```
┌─────────────────────────────────────────────────────────┐
│                     PHONE (PWA)                          │
│  - Camera capture                                        │
│  - Text/voice description                                │
│  - Optional address                                      │
└─────────────────┬───────────────────────────────────────┘
                  │ POST /api/captures
                  │ (photos uploaded direct to Storage via signed URL)
                  ▼
┌─────────────────────────────────────────────────────────┐
│        CLOUDFLARE PAGES / VERCEL  (capture UI + API)    │
│  - /api/captures: create job row, return signed URL     │
│  - /api/captures/:id: poll status                       │
│  - /presenter: big-screen view that polls + renders     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE                              │
│  - Storage: photos/                                      │
│  - DB: captures, external_context, extracted_items,      │
│        catalog_items, estimates                          │
└─────────────────┬───────────────────────────────────────┘
                  │ worker polls every 1-2s
                  ▼
┌─────────────────────────────────────────────────────────┐
│             WORKER (local Node + tunnel)                 │
│                                                          │
│   parallel:                                              │
│   ├── External context fetch (5s timeout per source)    │
│   │   ├── Google Static Maps (satellite)                │
│   │   ├── County GIS (parcel data)                      │
│   │   ├── NOAA (storms)                                 │
│   │   └── Permit feed (Utah)                            │
│   │                                                      │
│   └── Voice transcription (if voice provided)           │
│                                                          │
│   then sequential:                                       │
│   1. Surveyor agent (Claude Sonnet vision):             │
│      photos + description + external context            │
│      → structured scope items                           │
│   2. Estimator agent: items → matched SKUs + pricing    │
│   3. Generator agent: priced items → branded PDF        │
│   4. Upload PDF to Storage, write URL to estimates row  │
│   5. Sales agent (background, after estimate ready):    │
│      reviews scope + photos → suggests one upsell       │
│      → writes upsell row, phone polls + displays        │
└──────────────────────────────────────────────────────────┘
```

## Why this shape

**Async with worker, not synchronous.** Vercel/CF Pages function timeouts are 60s — the same as our demo budget. A single hiccup blows it. Async + polling gives us:
- Live progress UI (the "Analyzing photos…" theater)
- No timeout cliff
- Easy to debug (job rows are inspectable)
- Same architecture NBD Labs uses, so the patterns are warm

**Worker runs locally, exposed via tunnel.** Three reasons:
- Worker is the most-iterated component. Local = instant feedback.
- No deploy step blocking iteration.
- One less platform to log into during the event.
- Tunneled URL works from anywhere — phone connects via the public capture-UI URL, capture UI talks to Supabase, worker pulls from Supabase. No direct phone↔worker connection needed.

**External context behind small adapters.** Each source fails independently. If parcel data is slow, we still have satellite + permits. If everything fails, we degrade to photos + description and the demo still works.

**Description is the primary AI signal, photos verify, external context grounds.** This shapes the Surveyor agent's prompt:

```
SYSTEM (Surveyor): You are extracting a contractor estimate
scope from multiple property signals. The {description} is
the primary ground truth (rep or homeowner observation).
The {photos} verify and add detail. The {external_context}
grounds the estimate in property reality.

USER:
  Description: "Three windows on the southeast wall, double-hung,
  weather damage on seals, original install ~1995."

  Photos: [3 images]

  External context:
    - Satellite: [image]
    - Parcel: 2,400 sqft, built 1994, single-family
    - Permits: roof permit 2018, no window permits on file
    - Storm: hailstorm Aug 2023

  Trade pack: windows
  Available SKUs: [50 catalog items]

  Return: structured items with confidence, matched SKUs,
  rationale citing which signals contributed.
```

## Sales agent (upsell)

The Sales agent runs *after* the estimate renders, not in the critical latency path. Once the customer sees the estimate, the phone polls for an upsell suggestion. When it arrives (typically 5-15s after the PDF), it appears as a card under the estimate: "Noticed something — want to add this?"

```
SYSTEM (Sales): You're a contractor's assistant suggesting one
relevant upsell based on what was scoped. The tone is helpful
and observational, not pushy. Pick AT MOST one upsell that
would feel natural to a homeowner. If nothing fits, return null.

Upsell options for windows:
  - Gutter replacement (if gutters visible and aged)
  - Exterior trim repair (if trim shows wear)
  - Storm doors (if main door is original)
  - Solar panel quote (if roof + sun exposure favor it)

USER:
  Scope: [structured items]
  Photos: [same images]
  External context: [parcel + permits + storms]

  Return:
    {
      "upsell_id": string | null,
      "label": string,             // "Add gutter replacement"
      "rationale": string,         // "noticed worn gutters in photo 2"
      "estimated_add": number      // dollar amount
    }
```

**Why background, not blocking:** the upsell is a *delight* moment, not a *demo-blocking* moment. If it takes 20s to land, fine — the estimate is already on screen. If it fails entirely, the demo still works. Costs us nothing on the critical path.

**Demo moment:** rep hands phone to homeowner, estimate is showing. A few seconds later: "By the way — noticed the gutters look worn in your second photo. Add gutter replacement for $1,840?" Tap accept, totals update on screen. *That's* the agent-orchestra moment.

## Latency budget

```
0s ─────────────────────────────────────────────── 60s ────── 75s
│
├─ 0-3s   Phone upload (3 photos to Storage)
├─ 3-5s   API creates job, returns id
├─ 5-25s  Worker fetches external context  ┐
│         + transcribes voice              ├─ parallel
│         + downloads photos               ┘
├─ 25-50s Surveyor agent (Sonnet vision) — long pole
├─ 50-55s Estimator agent (catalog match)
├─ 55-60s Generator agent (PDF render + upload)
└─ 60s    Phone displays PDF (estimate complete)

then off the critical path:
├─ 60-75s Sales agent (upsell suggestion)
└─ 75s    Upsell card appears on phone under estimate
```

**Risk surface:** the Surveyor agent. Sonnet on 3-5 images with a 2K-token system prompt + ~500 tokens of external context can take 15-30s. If the spike (see [`spike-plan.md`](spike-plan.md)) shows >25s, options:
- Drop to Haiku for vision — faster, less smart, may need second-pass extraction
- Reduce image count (1-2 instead of 3-5)
- Resize images before sending (lower resolution = faster)
- Run two parallel vision calls and merge

The Sales agent runs after the demo's hero moment, so its latency doesn't threaten the <60s bar. Worst case: it lands during the demo's narration and is a happy surprise; best case: it lands while the rep is handing the phone to the homeowner.

## Tech choices (with default + escape hatch)

| Layer | Default | Escape hatch |
|---|---|---|
| Capture UI host | Cloudflare Pages | Vercel (warmer for the team) |
| Phone capture | Browser `<input type="file" capture>` + MediaRecorder | PWA with Service Worker (only if needed) |
| Storage + DB | Supabase | Local Postgres + S3-compat (only if Supabase has issues) |
| Worker | Local Node + cloudflared tunnel | Railway deploy |
| Vision model | Claude Sonnet 4.x | Claude Haiku 4.5 (latency cliff) |
| Voice transcription | Whisper API | Claude voice / browser SpeechRecognition |
| PDF render | Puppeteer | react-pdf |
| External: satellite | Google Static Maps API | Mapbox |
| External: parcel | Utah County GIS REST | Skip if too slow |
| External: storms | NOAA Storm Events API | Skip |
| External: permits | Utah-specific permit feed | Skip |

## Data model

```sql
-- captures: one per estimate request
captures (
  id uuid pk,
  status text,           -- pending | processing | done | error
  trade_pack text,       -- 'windows' | 'roofing'
  description text,
  voice_url text,        -- if voice path used
  address text,          -- optional
  photo_urls text[],     -- Storage refs
  created_at timestamptz,
  updated_at timestamptz
)

-- external_context: what we pulled per capture
external_context (
  capture_id uuid pk,
  satellite_url text,
  parcel_data jsonb,
  recent_permits jsonb,
  storm_events jsonb,
  fetched_at timestamptz
)

-- extracted_items: structured items from the AI
extracted_items (
  id uuid pk,
  capture_id uuid fk,
  item_type text,        -- 'window' | 'door' | 'roof_area' | etc.
  description text,
  dimensions jsonb,      -- {w, h, unit}
  qty int,
  condition text,
  confidence numeric,    -- 0-1
  matched_sku text fk,
  rationale text         -- which signals contributed
)

-- catalog_items: the staged trade-packs
catalog_items (
  sku text pk,
  trade text,            -- 'windows' | 'roofing'
  name text,
  manufacturer text,
  unit_price numeric,
  labor_hours numeric,
  description text
)

-- estimates: rendered output
estimates (
  capture_id uuid pk,
  pdf_url text,
  total numeric,
  line_items jsonb,
  informed_by jsonb,     -- which external sources contributed
  rendered_at timestamptz
)

-- upsells: Sales agent suggestions, populated after estimate
upsells (
  id uuid pk,
  capture_id uuid fk,
  upsell_id text,        -- 'gutter' | 'storm_door' | 'solar' | etc.
  label text,            -- "Add gutter replacement"
  rationale text,        -- "noticed worn gutters in photo 2"
  estimated_add numeric, -- dollar amount
  accepted boolean default false,
  suggested_at timestamptz
)
```

## What "done" looks like

- Phone-to-PDF in <60s on a real network
- Live progress UI shows the agent orchestra at work ("Surveyor analyzing…", "Estimator pricing…", "Generator rendering…")
- PDF is branded, customer-presentable, includes "informed by" sources
- Sales agent surfaces a contextual upsell within ~15s of the estimate landing
- Same flow works for `windows` and `roofing` trade-packs (toggle visible)
- Demo is reproducible 5 times in a row without a flake
