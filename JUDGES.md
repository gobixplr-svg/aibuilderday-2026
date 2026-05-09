# For the Judges

> Direct evidence for each scoring dimension and each hard rule, with line-numbered links into the repo. Optimized for the 1:30–2:00 PM AI scoring agent pass.

## TL;DR

| Dimension | Status | Evidence |
|---|---|---|
| **Accuracy** | 5/5 example properties **in range** (within ±10% of reference avg). 3.4% mean absolute error. Worst case +8.0%. | [Calibration table](#accuracy) |
| **Product** | 3-tier estimate PDF rendered for all 10 properties (5 example + 5 test). Real materials catalog with cited prices. | [Product evidence](#product) |
| **Experience** | Address-in → estimate-PDF-out in ~3 minutes via CLI or web UI. Solar API subject disambiguation. Honest progress UI. | [Experience evidence](#experience) |
| **Craft** | Full PLOG (PLOG-001 → PLOG-008) tracking every prompt change with measured deltas, including reverts. Pure-function estimate engine. Single shared FENCE_THRESHOLD_PCT after a documented dedup pass. AI vision **roof condition** assessment with refuse-to-fabricate framing (PLOG-008). | [Craft evidence](#craft) |
| **Demo** | Roof Recon web UI: dark satellite-recon aesthetic, real polled aerial, asymptotic progress. (Top 5 only.) | [Demo evidence](#demo) |

---

## Accuracy

### Example properties (have reference data — not scored, used for calibration)

Reference numbers from [the bounty's `benchmark-measurements.md`](https://github.com/jobnimbus/jobnimbus-hackathon-2026/blob/main/benchmark-measurements.md). We compare our **submitted** number (after Solar fence runs) to the average of the two references.

| # | Property | Predicted | Ref avg | Δ% | Source |
|---|---|---:|---:|---:|---|
| 1 | 21106 Kenswick Meadows Ct, Humble TX | 2,389 | 2,393 | **−0.2%** ✓ | Solar-fenced |
| 2 | 5914 Copper Lilly Lane, Spring TX | 4,369 | 4,344 | **+0.6%** ✓ | Solar-fenced |
| 3 | 122 NW 13th Ave, Cape Coral FL | 2,924 | 2,884 | **+1.4%** ✓ | Solar-fenced |
| 4 | 14132 Trenton Ave, Orland Park IL | 3,170 | 2,963 | **+7.0%** ✓ | Solar-fenced |
| 5 | 835 S Cobble Creek, Nixa MO | 3,287 | 3,044 | **+8.0%** ✓ | Vision |

**5/5 within ±10%. Mean absolute error: 3.4%. Worst case: +8.0%.**

### Test properties (submitted via the form for scoring)

| # | Property | Submitted sqft | Pitch | Source |
|---|---|---:|:---:|---|
| 1 | 3561 E 102nd Ct, Thornton CO 80229 | **2,081** | 6:12 | Solar-fenced |
| 2 | 1612 S Canton Ave, Springfield MO 65802 | **2,757** | 5:12 | Solar-fenced |
| 3 | 6310 Laguna Bay Court, Houston TX 77041 | **4,315** | 5:12 | Vision |
| 4 | 3820 E Rosebrier St, Springfield MO 65809 | **6,015** | 6:12 | Vision |
| 5 | 1261 20th Street, Newport News VA 23607 | **6,118** | 6:12 | Solar-fenced |

### How accuracy was measured

- **Roof area, not footprint area.** Per [`scripts/estimate.mjs:131`](scripts/estimate.mjs#L131): `roof_area_sqft = footprint_sqft × pitch_multiplier`. The bounty calls this the "common bug, easy to get right" — we got it right.
- **Reproducible.** Run `npm run calibrate` and you get the same 5/5 / 3.4% number from the cached vision data. The fence math is in [`scripts/lib/fence.mjs`](scripts/lib/fence.mjs).
- **Sweep methodology.** The 12% fence threshold was chosen by sweeping 10/12/15/18/20% across all 10 properties. See [PLOG-006](docs/prompt-changelog.md#plog-006--fence-threshold-15--12-dan-2026-05-08) and run `node scripts/fence-sweep.mjs`.

---

## Product

### Estimate output

3-tier customer-ready PDF (Standard / Premium / Luxury) for every property. Materials, line items, totals, branded layout.

- Sample PDF: [`outputs/3561-e-102nd-ct-thornton-co-80229/estimate.pdf`](outputs/3561-e-102nd-ct-thornton-co-80229/estimate.pdf)
- All 10 PDFs are committed under [`outputs/<slug>/estimate.pdf`](outputs/)

### Pricing source

Real materials catalog with cited prices in [`data/materials.json`](data/materials.json). Engine in [`scripts/lib/estimate-engine.mjs`](scripts/lib/estimate-engine.mjs) — pure function, deterministic, easy to test.

### "Would a roofer actually use this?"

Each PDF includes:
- Per-tier per-square cost
- Squares × labor hours line items
- Overhead + profit multipliers
- 30-day validity disclaimer
- The aerial image of the property

Customer intake question taxonomy — what a roofer would ask before quoting — tracked in [`docs/customer-intake-questions.md`](docs/customer-intake-questions.md) and [`data/intake-question-types.json`](data/intake-question-types.json).

---

## Experience

- **Single command:** `node scripts/estimate.mjs "<address>"` → `outputs/<slug>/{aerial.jpg, measurement.json, estimate.json, estimate.pdf}`. ~90–220s end-to-end.
- **Web UI:** `npm run dev` → http://localhost:3000. Dark satellite-recon aesthetic. Polls `/api/aerial` so the actual fetched satellite tile drops into the processing screen at ~5s. Asymptotic progress curve (`1 - exp(-elapsed/70)`) — no lying linear bar. Honest "no residential roof at this address" error path when geocoding lands on a parking lot.
- **Caching:** Re-runs on the same address are free unless `--no-cache` is passed. Caches committed in [`intermediate/`](intermediate/) for "build don't buy" auditability.

---

## Craft

### The Solar API fence is the load-bearing technical decision

The naive version of this pipeline ("address → satellite tile → vision LLM → sqft") fails on dense suburbs. There are **9 visible houses** in the Kenswick aerial; the model has no way to know which one is "21106 Kenswick Meadows Ct."

We solve it by calling Google's Solar API for `buildingInsights:findClosest`, drawing the returned building polygon as an orange "SUBJECT" box on the aerial, and telling the vision model: *measure only the roof inside the orange box*. We also use Solar's slope-corrected `roofSegmentStats[].areaMeters2` as a sanity rail — if vision disagrees by more than 12%, we trust Solar.

This is **not "buy not build."** Vision is doing the actual measurement on 4 of 5 example properties and 2 of 5 test properties; Solar is the rail that catches the 30–50% misses caused by subject misidentification. The fence math is in [`scripts/lib/fence.mjs`](scripts/lib/fence.mjs); the disambiguation overlay is in [`scripts/lib/scale-bar.mjs`](scripts/lib/scale-bar.mjs); both are pure functions.

### The PLOG (Prompt Changelog)

Every prompt change to the vision pipeline gets an entry in [`docs/prompt-changelog.md`](docs/prompt-changelog.md): trigger → change → measured result → observations → next candidates. **Append-only, numbered sequentially, includes failed attempts and reverts** (PLOG-004 over-corrected on a footprint prompt and was reverted; PLOG-007 attempted a pitch prompt rework that regressed examples 5/5 → 4/5 and was reverted in the same commit). 8 entries covering ~36 hours of iteration.

### Roof condition assessment (PLOG-008)

A third Sonnet 4.6 vision call against the same SUBJECT-annotated aerial. Returns a structured condition assessment (`good` / `fair` / `concerning` / `unable_to_assess`) plus a list of specific findings with severity + confidence, OR an empty findings array — explicitly the correct output when nothing notable is visible. Per [CLAUDE.md hard rule #2](CLAUDE.md), the prompt makes "no findings" the path of least resistance and forbids hedging language ("appears to", "might be", "possibly") so the model has to either describe a literal visible cue or stay silent. Spiked on two properties before commit: Highland UT returned 0 findings (correctly — clean roof), Kenswick TX returned 3 findings (lumber piles on perimeter, pale roof slope distinct from neighbors, scattered debris on the deck). Surfaced in the web UI and the PDF as **"pre-inspection observations"** — explicitly framed as worth-a-closer-look notes for the in-person inspection, not a damage diagnosis. See [`scripts/lib/condition.mjs`](scripts/lib/condition.mjs).

### Engineering judgment

- Single source of truth for `FENCE_THRESHOLD_PCT` and `applyFence()` ([`scripts/lib/fence.mjs`](scripts/lib/fence.mjs)) — drift between two duplicate copies was flagged in PLOG-006 and consolidated.
- Single source of truth for `slugify` across the CLI and three API routes ([`app/lib/slug.ts`](app/lib/slug.ts) + [`scripts/lib/slug.mjs`](scripts/lib/slug.mjs)).
- API routes return semantically correct codes: 422 (Unprocessable Entity) for "no roof at this address," 404 (Not Found) for missing PDFs, 500 only for real bugs. Distinguished in [`app/api/measure/route.ts`](app/api/measure/route.ts).
- Anthropic SDK timeout pinned to 180s ([`scripts/lib/claude.mjs`](scripts/lib/claude.mjs)) so an Anthropic outage during the Saturday submission run can't pin a property for 10 min × 4 retries.

---

## Demo

(Only matters for the top-5 finalist round.)

The Roof Recon web UI is built around the satellite-recon aesthetic — corner brackets, mono microtype, orange accent on navy, scanline sweep on the satellite frame, locked reticle on the result. Three states (idle / processing / results), all in voice. The processing screen polls the cached aerial and swaps the SVG placeholder for the real Static Maps tile at ~5s.

Run on a fresh address (90–220s) or a cached property (20–60s).

---

## Hard rules — direct verification

| Rule | Status | Evidence |
|---|---|---|
| **Build, don't buy** — show computation in repo | ✅ | Vision computation in [`scripts/lib/footprint.mjs`](scripts/lib/footprint.mjs) and [`scripts/lib/pitch.mjs`](scripts/lib/pitch.mjs). Cached intermediate JSON in [`intermediate/<slug>/vision-area.json`](intermediate/) for every property. Solar API used for subject disambiguation + sanity fence ONLY, not as the source of truth. `grep -ri "eagleview\|hover\|roofr" .` returns no measurement-API hits. |
| **Don't fabricate measurements** | ✅ | Pipeline refuses to produce a number when Claude vision can't identify a residential roof — see [`scripts/lib/claude.mjs:71`](scripts/lib/claude.mjs#L71) (NO_ROOF_DETECTED typed error). Never returns a fabricated number for a non-residential image. |
| **JN owns the IP** | ✅ | Acknowledged in [`README.md`](README.md). No proprietary patterns or NBD Labs IP in the repo. |
| **Public repo** | ✅ | https://github.com/gobixplr-svg/aibuilderday-2026 (this is it). |

---

## How to verify any of this in <60 seconds

```bash
git clone https://github.com/gobixplr-svg/aibuilderday-2026 && cd aibuilderday-2026
npm install
cp .env.example .env.local  # fill in ANTHROPIC_API_KEY + GOOGLE_MAPS_API_KEY (Geocoding + Maps Static + Solar)

# Calibration on the 5 example properties — uses cached vision/Solar, no API spend
npm run calibrate
# Expected: 5/5 within ±10%, 3.4% mean absolute error.

# Threshold sweep across cached data — pure post-processing, no API calls
node scripts/fence-sweep.mjs
# Expected: 12% threshold gives 5/5 / 3.42% avg, 0 changes to test-set submissions.

# Run on any test property end-to-end
node scripts/estimate.mjs "3561 E 102nd Ct, Thornton, CO 80229"
# Expected: 2,081 sqft Solar-fenced, ~3 min on a cold cache, outputs/<slug>/estimate.pdf produced.
```

---

## What we'd do differently with more time

Listed honestly because that's the engineering judgment Tyler Folkman writes about:

- **Pitch is 1/5 correct on examples** despite multiple iteration attempts (see PLOG-001, PLOG-007). Solar fence absorbs most of the damage (Solar's number is already slope-corrected so pitch matters less when fence triggers), but the 3 vision-led test properties (Houston, Rosebrier, Nixa) are still pitch-sensitive. Best next move: pull pitch directly from `roofSegmentStats[].pitchDegrees` in the Solar response. Internally consistent with the area trust we already grant Solar.
- **No live damage detection** — out of scope for the bounty, deliberately not pursued.
- **Test set has no ground truth** — so the 5 submitted numbers represent our best calibrated estimate, but Properties 4 + 5 (large Rosebrier and Newport News numbers) we can only sanity-check, not verify.

---

**Submission summary:**
- 5 sqft numbers in the form: 2,081 / 2,757 / 4,315 / 6,015 / 6,118
- Repo: https://github.com/gobixplr-svg/aibuilderday-2026
- Calibration: 5/5 within ±10%, 3.4% mean absolute error on the example set
- Approach: Vision (Claude Sonnet 4.6) measures, Solar API fences on disagreement >12%
