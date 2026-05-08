# Field Capture — Hackathon Concept Prompt

> Working title. Built for AI Builder Day, May 8–9 2026, JobNimbus $10K bounty track.
> **Updated at event:**
> - Reframed from two-input (photos + voice) to three-input (photos + description + external context).
> - Reframed from "vision pipeline" to **agent orchestra** — Surveyor + Estimator + Generator + Sales, with future agents visible to show platform thesis.
> - Added Sales upsell agent as a post-estimate delight moment.
> - **Bounty clarification (Friday morning):** JobNimbus said in the brief presentation they want **aerial imagery → bid**. Aerial is now the primary input; ground photos and description enrich.
> - **Stack locked:** Next.js + Tailwind, mobile-first responsive PWA. Not Flutter, not native. Reasoning in `docs/architecture.md`.

## Problem

Contractor estimates today take 30+ minutes per job because the rep has to leave the site, return to an office, transcribe what they saw, look up materials, and assemble a proposal. Existing AI estimating tools (Roofr, JobNimbus Smart Estimates) start from a *single* signal — satellite imagery for roofs, a plan PDF for new builds. Reality on the ground is messier: an experienced rep weighs photos of the actual condition, a homeowner's description of the history, and external context (parcel data, recent storms, prior permits) to land on a credible number. No tool stitches those signals together.

## Solution

A property-estimate primitive: **address in, customer-ready bid out, in under 60 seconds.** Aerial imagery is the primary signal; ground-level photos and rep description enrich the bid when available.

Three input layers, ordered by primacy:

1. **Aerial imagery + property metadata** *(primary)* — satellite/aerial imagery, parcel data, permit history, recent storms. Pulled automatically from the address. This is what JobNimbus asked for — bid from aerial.
2. **Ground photos** *(enrichment)* — uploaded or captured by a rep on site. Add detail the satellite can't see (window condition, trim wear, gutter age).
3. **Description** *(enrichment)* — typed or voice context from the rep or homeowner. Adds intent, history, scope clarification.

The bid is rendered as a customer-presentable PDF in under 60 seconds — even with just an address. Add photos and description, and the bid sharpens.

The capability is positioned as a *platform primitive* — an SDK / API surface — not a vertical product. JobNimbus, AccuLynx, JobTread, or any contractor-CRM can drop it into their workflow. So can insurance adjusters, real estate investors, and solar installers. The verticals are configs.

## Target User

**Buyer (the room we're pitching to):** Contractor-CRM platforms that need an AI-native estimate-creation layer but don't want to build vision + multi-source-data pipelines themselves. Tyler Folkman / JobNimbus is the immediate target.

**End users (downstream):**
- **Field-going contractor reps** — roofer, window installer, siding, exterior. Today either skip small jobs or lose deals to slow proposals.
- **Insurance adjusters** — assessing damage claims; need a fast, defensible estimate.
- **Real estate investors / wholesalers** — pricing rehab work on properties they're considering.
- **Solar installers, fence/deck builders, painters** — anyone whose business is "estimate from a property visit."

This is broader than "field capture for contractors." The primitive *is* the product.

## Core Insight

Four converging bets:

1. **Aerial alone is necessary but not sufficient.** Roofr proves aerial-to-bid works for roofing. But aerial misses condition (worn shingles vs new), context (the homeowner's history with the property), and edge cases the satellite can't see. The system that grades up from aerial-only to aerial-plus-ground-plus-context is the system that wins both office estimates *and* on-site estimates.
2. **External context is free leverage.** Parcel data, permits, storm history are all available via public APIs in seconds. A bid that cites "roof permit on file from 2018" or "hailstorm August 2023" is qualitatively more credible than one that doesn't.
3. **Speed-to-customer-presentable PDF is the unlock, not just speed-to-data.** A structured JSON in 30 seconds doesn't close a deal. A branded, customer-ready document handed to a homeowner *while you're still on their porch* does. The output layer matters as much as the extraction.
4. **Vertical-portability is the platform thesis.** A single estimate engine that swaps trade-packs (windows / roofing / siding / doors) is more defensible than another point solution. The same primitive serves contractors, adjusters, and investors.

## Agent orchestra

We orchestrate four specialized AI agents in v1, with two more visible as "future agents" to show the platform thesis:

**v1 (shipping Saturday):**
- **Surveyor** — fuses photos + description + external context into structured scope
- **Estimator** — matches scope to trade-pack catalog and prices the job
- **Generator** — renders the branded customer-ready PDF
- **Sales** — after the estimate lands, suggests one contextual upsell (e.g. "noticed worn gutters — add replacement?")

**Future (named, not built):**
- **Validator** — sanity-checks against historical/benchmark pricing
- **Communicator** — emails/texts the estimate, schedules follow-up

Same architecture, sharper story — and aligned with where JobNimbus is already going with Scout.

## MVP Features (ranked)

1. **Address-to-bid flow.** Type an address. System pulls aerial imagery, parcel data, permits, storms. Surveyor analyzes the aerial. Estimator prices. Generator renders the PDF. Bid lands in under 60 seconds. This is the JobNimbus brief, executed literally.

2. **Surveyor agent → structured scope.** Aerial imagery + property metadata (+ optional photos and description) feed a single Claude Sonnet call producing structured items (type, count, dims, condition, confidence). Aerial is the primary signal; metadata grounds; photos and description refine.

3. **External context lookup.** Given an address, fetch: aerial/satellite imagery (Google Static Maps or Mapbox), parcel data (county GIS APIs), and at least one of: storm/weather history (NOAA), permit records (Utah-specific feeds where available). Time-budgeted — if a source doesn't return in 5 seconds, drop it.

4. **Optional ground-level enrichment.** When a rep is on site, they can add photos and a description through a phone-friendly capture page. The bid refines with detail the aerial couldn't provide. Differentiates us from aerial-only competitors.

5. **Estimator + Generator → customer-ready PDF.** Estimator matches items to a staged trade-pack catalog (~50 SKUs per trade). Generator renders a branded estimate PDF — line items, prices, totals, "informed by" footnote citing which external sources contributed. Two trade-packs: **roofing** (matches bounty) and **windows** (proves portability).

6. **Sales agent upsell (post-estimate).** Once the estimate is on screen, a background Sales agent reviews scope + imagery + context and suggests one contextual upsell. Surfaces as a card under the estimate ~10-15s after the PDF lands. Tap accept → totals update. This is the agent-orchestra demo moment.

7. **Three-act demo path.**
   - **Act 1 (the brief):** type a real Lehi address → aerial + parcel + permits → roofing bid. *No phone, no photos.* This is what JobNimbus asked for.
   - **Act 2 (the differentiator):** add ground photos and a rep description for the same address → bid refines with detail the satellite couldn't see. *This is what no other team will have.*
   - **Act 3 (the platform):** swap trade-pack to windows on the same address → window bid. Same engine, different vertical.
   - **Sales agent fires** somewhere in Act 1 or 2 to surface the upsell moment.

## Explicitly NOT in v1

- **Real JobNimbus API integration.** Fragile; not worth the demo risk. Frame as "in production this calls JobNimbus's documented API — today we've staged the catalog and the customer history."
- **Photo geometry / measurement-from-image.** Real measurement extraction is its own research problem. Description provides dimensions; photos verify.
- **Multi-rep / multi-tenant infra.** No accounts, no roles, no org isolation in the demo.
- **CRM sync, email delivery, e-signature, payments.** Out of scope.
- **Mobile native app.** Web app / PWA over phone browser is fine.
- **Real-time external data writes.** External context is read-only; we pull, we don't push.
- **Coverage of every external source we cite.** Demo with 2-3 working sources, frame the others as "configurable adapters."

## Technical Shape

**Architecture (Shape B — async with worker):**

```
Phone (PWA, mobile-first)
   │
   │  upload photos + description + (optional) address
   ▼
Cloudflare Pages or Vercel (capture UI)
   │
   ▼
Supabase (Storage + DB)
   │  ← worker polls jobs every 1-2s
   ▼
Local Node worker (exposed via tunnel) OR Railway worker
   │
   ├─→ External context fetch (parcel, satellite, permits) [parallel]
   ├─→ Voice transcription [parallel, if voice used]
   │
   └─→ Claude Sonnet vision call (fuses all three inputs)
   │
   ├─→ Catalog match
   └─→ PDF render
   │
   ▼
Result URL written back to Supabase
   │
   ▼
Phone polls job, displays PDF
Presenter screen polls job, displays PDF on big screen
```

**Stack:**
- **Frontend:** Next.js + Tailwind, deployed to Cloudflare Pages or Vercel. Mobile-first PWA.
- **Backend storage/DB:** Supabase (Storage + Postgres + Realtime if useful).
- **Worker:** Node.js, runs locally on a team laptop, exposed via `cloudflared tunnel` or `ngrok`. No deploy needed for the most-likely-to-iterate component.
- **AI:** Anthropic Claude Sonnet (vision + extraction in single call). Whisper or Claude for voice transcription if voice path is used.
- **PDF:** Puppeteer (server-side) or react-pdf (Node-side) — worker decides based on what gets us a great-looking PDF fastest.
- **External APIs:** Google Static Maps, county GIS (varies by location), NOAA storms API, Utah permit feeds. Each behind a small adapter so they can fail independently.

**Data model (rough):**
- `captures` — one per estimate request. Holds photos (Storage refs), description, address, status, trade-pack.
- `external_context` — JSONB blob of what we pulled per capture (satellite_url, parcel_data, recent_permits, storm_events).
- `extracted_items` — line items derived from the fused inputs.
- `catalog_items` — the trade-pack tables. Trade enum: `windows` | `roofing`.
- `estimates` — the rendered output: priced line items, totals, brand metadata, "informed by" sources, PDF storage URL.

## User Flow (primary)

**Office estimator flow (the brief):**

1. User types an address on a laptop or phone.
2. Selects trade-pack (roofing or windows).
3. Taps Estimate. UI shows live progress: "Pulling aerial…" → "Reading parcel + permits…" → "Surveyor analyzing…" → "Estimator pricing…" → "Generator rendering…" (total <60s).
4. Bid renders on screen. Customer-ready PDF: brand header, satellite thumbnail, line items, prices, total, "informed by" footnote, signature line.
5. Sales agent surfaces a contextual upsell card 10-15s later.

**Field rep flow (the differentiator):**

Same as above, with an extra step: rep opens the same app on a phone, finds the existing bid (or starts fresh from address), adds 2-3 photos and a description. Bid refines.

## Open Questions

- **Which external data sources actually work in the latency budget?** Spike Friday afternoon with a real Lehi address. Adapters that take >5s get dropped; we ship with whatever responds reliably.
- **What's the right description-input UX?** Probably "type by default, voice button as accent" — typing is faster on a quiet stage than voice, and voice is unreliable in venue noise. Voice stays in the demo but isn't load-bearing.
- **How do we make the "staged catalog" feel real, not toy?** Real product names, real-ish prices from manufacturer spec sheets (Marvin/Andersen/Pella for windows; GAF/CertainTeed for roofing). 30-50 SKUs per trade is enough.
- **Demo property:** which real Lehi address gets pre-staged for Acts 2 and 3? Need to pick Friday evening, capture photos, verify external sources have data on it.
- **Friday twist contingency.** The 1:05pm twist may shift the brief. The three-input architecture is general enough to absorb most twists; trade-packs are configurable enough to swap focus.
- **IP/ownership of submission.** No public terms exist; watch for participation language at check-in.

## Success Criteria

**Demo bar (Saturday 2pm):**
- Live phone-to-PDF works end-to-end in <60 seconds.
- Output PDF is genuinely customer-presentable.
- "Three-input fusion" is visible — judges can see external context contributing to the estimate (satellite thumbnail, "permit from 2018" footnote, etc.).
- Sales agent surfaces a contextual upsell within ~15s of the estimate, with a rationale ("noticed worn gutters in photo 2").
- "Two trades, one engine" config swap works.

**Strategic bar (Saturday evening):**
- Tyler Folkman or another senior JobNimbus engineer asks an unprompted follow-up question.
- The team walks out with at least one named contact at JobNimbus.

**Stretch:**
- A meeting on the calendar with JobNimbus the following week.
- Architecture portable enough to slot into NBD Labs / Crosswing as a future product.
