# Field Capture — Hackathon Concept Prompt

> Working title. Built for AI Builder Day, May 8–9 2026, JobNimbus $10K bounty track.

## Problem

Contractor estimates today take 30+ minutes per job because the rep has to leave the site, return to an office, transcribe what they saw, look up materials, and assemble a proposal. Existing AI estimating tools (Roofr, JobNimbus Smart Estimates) start from satellite imagery or a plan PDF — they don't have an answer for the moment a rep is physically standing in front of the work. That moment is where most contracting estimates actually originate, and it's the modality every existing tool is missing.

## Solution

A field-capture primitive: photos + voice in, structured customer-ready estimate out, in under 60 seconds. The rep pulls out a phone, takes a few pictures, voices a short context note, and a branded estimate PDF renders on the customer's screen before the rep leaves the driveway. The capability is positioned as a *platform primitive* (an SDK / API surface), not a vertical product — JobNimbus or any contractor-CRM can drop it into their own workflow.

## Target User

Two layers:

- **End user (in the long run):** A field-going contractor sales rep — roofer, window installer, siding, fenestration — who today either skips small jobs because the estimate isn't worth 30 min back at the office, or loses deals because the customer goes cold between visit and proposal.
- **Customer (the buyer of the primitive):** Contractor-CRM platforms like JobNimbus, AccuLynx, JobTread who need an AI-native field-capture layer but don't want to build vision pipelines themselves. *This is who Tyler Folkman represents in the room.*

## Core Insight

Three converging bets:

1. **The site visit is the missing input modality.** Every AI estimating tool starts from imagery a satellite captured or a plan an architect drew. Reality: most exterior contracting estimates start with a human standing in front of the work. The first tool to nail that moment owns the workflow.
2. **Speed-to-customer-presentable PDF is the unlock, not just speed-to-data.** A structured JSON in 30 seconds doesn't close a deal. A branded, customer-ready document handed to a homeowner *while you're still on their porch* does. The output layer matters as much as the extraction.
3. **Vertical-portability is the platform thesis.** A single capture engine that swaps trade-packs (windows / roofing / siding / doors) is more defensible than another point solution. Field capture is a primitive; verticals are configs.

## MVP Features (ranked)

1. **Phone-to-PDF capture flow.** A web app the phone can open: take photos, hold-to-talk for voice context, submit. The rep does this in <30 seconds. Critical because this is the demo's killer moment — everything else supports it.

2. **Vision + voice → structured scope extraction.** Claude vision model analyzes photos and combines with transcribed voice context to produce structured items (dimensions, type, condition, count). Includes a small confidence/quality flag per item so reps know what to verify.

3. **Trade-pack matching against a staged catalog (~50–100 SKUs).** Extracted items match against a curated catalog of products + prices. Initial trade pack is **windows** (matches the conference-room demo reality and the team's domain expertise). One catalog table, swappable per trade.

4. **Customer-ready PDF output.** Branded, presentable estimate document — line items, prices, totals, a polish layer over the raw extraction. Rendered server-side, viewable on any screen, downloadable.

5. **"Two trades, one engine" demo path.** Second trade-pack staged (roofing, since it's the bounty's flavor) so the demo can show the same capture flow producing a different vertical's estimate with a config swap. This is what makes the primitive thesis visible.

## Explicitly NOT in v1

- **Real JobNimbus API integration.** Tempting but fragile; not worth the demo risk. Frame as "in production this calls JobNimbus's documented API — today we've staged the catalog."
- **Photo geometry / measurement-from-image.** Real measurement extraction is its own research problem. Voice provides dimensions; vision validates plausibility. Don't promise pixel-accurate takeoff.
- **Multi-rep / multi-tenant infra.** No accounts, no roles, no org isolation in the demo. One rep, one device, one demo. Production-architecture-shaped but not built.
- **CRM sync, email delivery, e-signature, payments.** Real follow-up flow. Out of scope for 24 hours.
- **Mobile native app.** Web app over phone Safari is fine; the camera/mic APIs work and it lets us iterate fast.
- **Calibration, scale calibration, AR overlays.** Cool, hard, distracting. Future work.

## Technical Shape

- **Platform:** Web app, mobile-first PWA. Phone Safari/Chrome for capture; presenter screen mirrors the result PDF.
- **Backend:** Supabase for auth/storage/DB (familiar stack, fast to scaffold). Worker for AI calls if latency requires async (but aiming for synchronous request/response inside the <60s envelope).
- **Key Integrations:**
  - **Anthropic Claude (Sonnet)** — vision model for photo analysis, multimodal extraction.
  - **Whisper or Claude voice** — voice-to-text for the voice context note.
  - **PDF generation library** (e.g., react-pdf or Puppeteer) for the customer-ready output.
  - **JobNimbus API (mocked)** — staged catalog standing in for the real call.
- **Data Model (rough):**
  - `captures` — one per site visit. Holds raw photos, voice transcript, status, trade-pack used.
  - `extracted_items` — line items derived from a capture (mark, type, dims, qty, condition, confidence).
  - `catalog_items` — the trade-pack: SKU, name, unit price, labor hours, trade. Multiple trade packs supported via a `trade` enum.
  - `estimates` — the rendered output: list of priced line items, totals, brand metadata, PDF storage URL.

## User Flow (primary)

1. **Rep opens the web app on phone.** Lands on capture screen — three big buttons: "Take Photos," "Hold to Talk," "Submit."
2. **Captures 3–5 photos.** Conference-room window for the demo. Real-world: the work area on a job site.
3. **Holds to talk for ~10 seconds.** "Three windows on the southeast wall, double-hung, looks like 30-year-old units, weather damage on the seals."
4. **Taps Submit.** UI shows live progress: "Analyzing photos…" → "Matching catalog…" → "Building estimate…" (each step <15s, total <60s).
5. **Estimate renders on the presenter screen** (and on the phone). Customer-ready PDF: header brand, line items with prices, total, footer. Rep can hand the phone to the homeowner.

**Demo escalation:** rep does the same flow a second time with a roof photo, system loads the *roofing* trade-pack (toggle visible), produces a roofing estimate. "Same engine, different trade. That's the primitive."

## Open Questions

- **What's the right voice-input UX on phone?** Hold-to-talk vs tap-to-record vs continuous-while-photographing. Probably hold-to-talk for demo simplicity.
- **How do we make the "staged catalog" feel real, not toy?** Real product names, real-ish prices pulled from manufacturer spec sheets, branded line items in the PDF. Avoid "Acme Window 1, 2, 3."
- **Friday twist contingency.** The 1:05pm twist may shift the brief. What's our pivot path if the twist is "must process roof imagery specifically" or "must integrate JobNimbus API for real" or "must produce X format"? Plan for stack-level prep that survives any twist; defer product-specific scaffolding until Friday afternoon.
- **Where does the conference-room demo's photo input come from for the *roofing* second-trade demo?** Pre-stage a printed photo of a roof? Pull a roof image from the phone's library? Need to commit to one before Saturday morning.
- **What's the demo narrative arc?** Three minutes is short. Probably: 30s problem framing → 60s phone-to-PDF demo (live) → 30s "now watch this with roofing" → 60s "this is a primitive, here's why JobNimbus needs this" close.
- **IP/ownership of submission.** Awaiting written response from JustBuild (`hello@justbuild.ing`). Hold any pre-built product code that would create exposure.

## Success Criteria

**Demo bar (Saturday 2pm):**
- Live phone-to-PDF works end-to-end in <60 seconds with no fallback path needed.
- Output PDF is genuinely customer-presentable — a homeowner could read it and understand the price.
- "Two trades, one engine" toggle works on a second capture.

**Strategic bar (Saturday evening):**
- Tyler Folkman or another senior JobNimbus engineer asks an unprompted follow-up question after the demo.
- The team walks out with at least one named contact at JobNimbus to follow up with.

**Stretch (post-event):**
- A meeting on the calendar with JobNimbus the following week.
- Field Capture is portable enough to slot in as a fourth Crosswing product after the event.
