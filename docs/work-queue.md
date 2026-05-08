# Work Queue

> Pick a task, put your name on it, mark it claimed in the table below. Don't sit on a long PR — push early, push often. Aim for "scaffold up, no logic yet" merges so others can branch off.

## Status legend

- ⚪ Open — unclaimed
- 🟡 Claimed — has owner, in progress
- 🟢 Done — merged to main

## Task table

| # | Task | Owner | Status | Est | Blockers |
|---|---|---|---|---|---|
| 1 | Spike A — vision latency | | ⚪ | 1h | none |
| 2 | Spike B — external context sources | | ⚪ | 2h | none |
| 3 | Next.js + Supabase scaffold | | ⚪ | 1.5h | none |
| 4 | Catalog research & content | | ⚪ | 2h | none |
| 5 | Brand assets + PDF template | | ⚪ | 2h | none |
| 6 | Phone capture page | | ⚪ | 2h | #3 |
| 7 | Worker skeleton | | ⚪ | 2h | #3 |
| 8 | Presenter view | | ⚪ | 1h | #3 |
| 9 | Surveyor agent — real prompts | | ⚪ | 3h | #1, #2, #7 |
| 10 | External context adapters | | ⚪ | 2h | #2, #7 |
| 11 | Estimator + Generator agents | | ⚪ | 3h | #4, #5, #9 |
| 12 | Sales upsell agent | | ⚪ | 1.5h | #11 |

## Suggested first picks (4 people, parallel)

- **Dan:** #1 (vision latency spike)
- **Will:** pair on #1, then #7 (worker skeleton)
- **Eric:** #2 (external context spike), then #3 (scaffold)
- **Ethan:** #4 (catalog research) — pure parallel, no code dependency

After ~2 hours: spikes done, scaffold deployed, catalog content ready. Then we converge.

---

## Tasks (detail)

### 1. Spike A — vision latency

**Goal:** know whether Claude Sonnet vision can return structured items from a real Surveyor prompt in under 25 seconds, repeatably.

**Steps:**
- Pull 3 sample aerial images (Google Static Maps screenshots of real Lehi addresses)
- Run Claude Sonnet 4.x with the Surveyor prompt template from `architecture.md`
- 5 trial runs per image, measure: API latency, token count, output quality (JSON parses? items sensible?)
- Test variations: Sonnet vs Haiku, 1024px vs 2048px, with/without parcel context
- Document chosen settings in `docs/spike-results.md`

**Decision:**
- Median <20s on Sonnet → proceed with default
- 20-30s → consider parallel calls or downscale
- >30s → fall back to Haiku, accept lower fidelity

**Output:** entry in `docs/spike-results.md`

---

### 2. Spike B — external context sources

**Goal:** know which external data APIs return useful data on a Lehi address inside the 5-second budget.

**Setup:** pick a real Lehi address. **Recommendation: JobNimbus HQ — 3451 N Triumph Blvd, Lehi UT 84043.** Meta to use it as the demo property too.

**Test each source for: latency, success/fail, data shape, useful for an estimate?**

| Source | Endpoint hint | What we want |
|---|---|---|
| Google Static Maps | `maps.googleapis.com/maps/api/staticmap` | Aerial image URL |
| Mapbox Static | `api.mapbox.com/styles/v1/.../static/...` | Aerial image URL |
| Utah State GIS | `gis.utah.gov` | Statewide parcel data |
| Utah County GIS | search county + "parcel REST API" | Parcel polygon, sqft, year built |
| NOAA Storm Events | `ncei.noaa.gov/access/services/data/v1` | Storms in the area, last 5 years |
| Lehi/Utah permits | research at event | Recent permits on the address |
| OpenStreetMap | Overpass API | Building footprint, height |

**Decision:**
- Top 3 fastest + most useful sources → into the worker as adapters
- Others → noted as "future" in architecture
- If <2 sources work → demo de-emphasizes external context, leans on description

**Output:** entry in `docs/spike-results.md`, list of surviving sources

---

### 3. Next.js + Supabase scaffold

**Goal:** working Next.js app deployed somewhere, Supabase wired, schema migrated, placeholder home page. Every other task depends on this.

**Steps:**
- `npx create-next-app@latest app/` with TypeScript + Tailwind v4
- Install `@supabase/ssr` and `@supabase/supabase-js`
- Set up Supabase project (free tier is fine for the weekend)
- Run schema migration from `docs/architecture.md` data model section: `captures`, `external_context`, `extracted_items`, `catalog_items`, `estimates`, `upsells`
- Configure browser + server Supabase clients (`src/lib/supabase/`)
- Deploy to Vercel or Cloudflare Pages with a placeholder home page
- Push environment variables to deployment
- Commit early — "scaffold up, no logic yet"

**Output:** deployed URL, working Supabase project, all 6 tables present

---

### 4. Catalog research & content

**Goal:** the staged catalog feels real, not toy. 30-50 SKUs per trade pack with real product names and credible prices.

**Roofing pack (~30-50 SKUs):**
- GAF Timberline HDZ, GAF Timberline UHDZ, CertainTeed Landmark, CertainTeed Landmark Pro, Owens Corning Duration, Owens Corning Oakridge, IKO Cambridge, Atlas Pinnacle Pristine
- Categories: 3-tab, architectural, designer, premium
- Per-square pricing (a "square" = 100 sqft of roof)
- Labor hours per square (1.5-2.5 typical)
- Underlayment, ridge cap, starter strip, drip edge, ice & water shield as separate line items

**Windows pack (~30-50 SKUs):**
- Marvin Essential, Marvin Elevate, Marvin Ultimate (casement / double-hung / picture / awning variants)
- Andersen 400 Series, Andersen 100 Series
- Pella 250 Series, Pella Reserve
- Per-unit pricing by size class
- Labor hours per opening (2-4 typical)

**Sources:**
- Manufacturer spec sheets (public)
- Contractor pricing forums (Reddit r/roofing, ContractorTalk)
- Home Depot / Lowes for ballpark prices on common products
- HomeAdvisor / Angie's List averages

**Format:** JSON file in `docs/reference/catalog-roofing.json` and `docs/reference/catalog-windows.json`. Schema:

```json
{
  "sku": "GAF-TIMB-HDZ-CHARCOAL",
  "trade": "roofing",
  "name": "GAF Timberline HDZ",
  "manufacturer": "GAF",
  "color_or_variant": "Charcoal",
  "unit": "square",
  "unit_price": 145.00,
  "labor_hours_per_unit": 2.0,
  "description": "Architectural laminate shingle, 30-yr warranty, ..."
}
```

**Output:** two JSON files committed to repo, ready to seed `catalog_items` table

---

### 5. Brand assets + PDF template

**Goal:** the rendered PDF looks like something a contractor would actually hand a homeowner. 25% of the grade is design — this owns it.

**Steps:**
- Mock a contractor brand. Suggested: **"Apex Roofing & Exteriors"** (broad enough to cover roofing + windows). Generate a wordmark / simple logo. Free options: a clean sans-serif name + small icon, or use a tool like Canva/Figma.
- Color palette: contractor-credible. Navy + red accent works. Or charcoal + safety orange. Avoid pastels.
- Typography: bold sans-serif headers, clean readable body. Free: Inter, Manrope, Source Sans 3.
- PDF template (HTML/CSS for Puppeteer, or react-pdf components):
  - Header: brand wordmark, "Estimate," date, estimate number
  - Customer block: name, address, prepared by
  - Property block: satellite thumbnail (left), property facts (right) — "Built 1994 · 2,400 sqft · Permit on file 2018"
  - Line items table: SKU, description, qty, unit price, total
  - Subtotal / tax placeholder / total
  - "Informed by" footnote: small text citing aerial imagery, parcel data, permits
  - Signature line + "valid 30 days"
  - Footer: brand contact info (mocked)
- Test render at US Letter — make sure it doesn't overflow on 30-line bills

**Output:**
- Brand assets committed under `docs/brand/` (logo SVG/PNG, palette in `tokens.md`)
- PDF template committed under `app/src/components/estimate-pdf/` (after #3)

---

### 6. Phone capture page

**Goal:** mobile-first capture page where a rep can enter address, optionally add photos + description, and submit.

**Blockers:** #3 (scaffold)

**Steps:**
- Route: `/capture` (also accessible as `/`)
- Form fields:
  - Address (autocomplete optional, plain text fine)
  - Trade-pack selector (radio: Roofing / Windows)
  - Photos: `<input type="file" capture="environment" multiple>` — 0 to 5
  - Description: textarea + voice button (MediaRecorder)
- POST `/api/captures`:
  - Creates a `captures` row (status='pending')
  - Returns signed URLs for direct-to-Storage photo uploads
  - Browser uploads photos in parallel
  - Browser PATCHes `/api/captures/:id` to mark photos uploaded → status='ready'
- Redirect to `/captures/:id` (status page that polls)

**Mobile-first Tailwind layout. Big buttons. Looks like an app, not a form.**

**Output:** working capture flow, end-to-end from form → DB row + photos in Storage

---

### 7. Worker skeleton

**Goal:** local Node worker that polls Supabase for pending jobs, runs stub steps, updates status. Real agents replace stubs in #9-12.

**Blockers:** #3 (scaffold + Supabase tables)

**Steps:**
- `worker/index.mjs`: poll `captures` where `status='ready'` every 1-2s
- For each job:
  - Update status to 'processing'
  - Run stub steps with sleeps:
    - "Pulling external context…" (3s sleep, write mock blob to `external_context`)
    - "Surveyor analyzing…" (5s sleep, write mock items to `extracted_items`)
    - "Estimator pricing…" (2s sleep, write mock matches)
    - "Generator rendering…" (2s sleep, write mock PDF URL to `estimates`)
  - Status to 'done'
- Sales agent stub: 5s after estimate done, write a mock upsell row
- Expose worker via `cloudflared tunnel` or `ngrok` (only needed if worker calls back to deployed app, which it shouldn't — worker only reads/writes Supabase)
- Logs structured for debugging

**Output:** stub worker that processes jobs end-to-end, ready for real agents to drop in

---

### 8. Presenter view

**Goal:** big-screen view that mirrors the latest estimate state. What judges watch on the projector during the demo.

**Blockers:** #3 (scaffold)

**Steps:**
- Route: `/presenter/[capture_id]`
- Polls capture + estimate + upsell every 1s
- Layout:
  - Header: "AI Builder Day · [trade pack]"
  - Big progress chips while processing — "✓ Pulling property data" / "⏳ Surveyor analyzing" / "○ Estimator pricing"
  - When estimate done: PDF embedded inline (iframe to pdf_url, or rendered React)
  - When upsell appears: card slides in below estimate
- Auto-fullscreen on mount (or styled to look fullscreen)

**Output:** projector-ready URL that updates live

---

### 9. Surveyor agent — real prompts

**Goal:** the AI returns parseable, sensible structured scope items from real aerial + metadata + (optional) ground photos.

**Blockers:** #1 (latency confirmed), #2 (sources confirmed), #7 (worker skeleton to wire into)

**Steps:**
- Replace the Surveyor stub in worker with a real Anthropic SDK call
- Prompt template per `architecture.md` Surveyor section
- Test with: aerial-only input (Act 1 mode), aerial + ground photos (Act 2 mode)
- Iterate until JSON parses cleanly and items are credible
- Test both trade packs (roofing + windows)
- Confidence flags per item
- Build a small ground-truth set (3-5 known properties with expected items) to regression-check changes

**Output:** real Surveyor agent in worker, scoped JSON written to `extracted_items`

---

### 10. External context adapters

**Goal:** real data from the surviving sources from Spike B, behind small adapters that fail independently.

**Blockers:** #2 (Spike B), #7 (worker skeleton)

**Steps:**
- One file per source: `worker/sources/google-maps.mjs`, `worker/sources/utah-gis.mjs`, etc.
- Each exports an async function `(address) → data | null`
- 5s timeout per source, swallow errors, return null
- Worker calls all in parallel, merges what comes back into `external_context` row

**Output:** 2-3 working adapters, real data flowing into `external_context`

---

### 11. Estimator + Generator agents

**Goal:** scoped items become a priced bid, rendered as a branded PDF.

**Blockers:** #4 (catalog), #5 (PDF template), #9 (Surveyor produces scope)

**Steps:**
- **Estimator:** for each scope item, match to catalog SKU. Either rule-based (string match + best-fit) or LLM-driven (small Haiku call). Output: priced line items with SKU, qty, unit price, labor.
- **Generator:** render `estimates` row into a PDF via Puppeteer or react-pdf, using the template from #5. Upload to Supabase Storage. Write `pdf_url` to `estimates`.

**Output:** real PDF generated end-to-end for a real address

---

### 12. Sales upsell agent

**Goal:** post-estimate, a contextual upsell appears as a card on the phone + presenter view.

**Blockers:** #11

**Steps:**
- After `estimates` row is written, run Sales agent prompt (per `architecture.md`)
- Inputs: scope items, photos, external context, trade-pack
- Output: at most one upsell row in `upsells` table
- Phone + presenter poll the upsells table
- Card UI: "By the way — noticed [rationale]. Add [label] for $[estimated_add]?" + Accept button
- On accept: update totals (or mock the update for the demo)

**Pre-stage a baseline upsell rule** (e.g., always offer gutters when description mentions "old" or aerial shows worn gutters) so even a flaky LLM hits it.

**Output:** upsell card appears reliably on the demo

---

## Coordination notes

- **Push early, push often.** "Scaffold up, no logic yet" commits unblock the team.
- **Branch per task** if anyone wants to PR. Otherwise main is fine for this scale.
- **Pick a comms channel** at kickoff. Slack DM, in-person, or GitHub issues — one of them.
- **Address pick:** JobNimbus HQ recommended. Whoever's outside first, capture 5 ground-level photos for Act 2.
- **Don't relitigate the stack** unless something concrete fails. Decision rationale is in `architecture.md`.
- **Update this file** as you claim and complete tasks. The status table is the single source of truth.
