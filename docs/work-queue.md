# Work Queue

> Pivoted to match the actual JobNimbus bounty brief: aerial → roof measurement (sqft) + estimate. Five test addresses. Submission by Saturday 1:30 PM via the bounty form. Ground truth in `benchmarks/`.
>
> Pick a task, put your name on it. Push early. Update the table.

## Status legend

- ⚪ Open — unclaimed
- 🟡 Claimed — has owner, in progress
- 🟢 Done — merged

## Task table

| # | Task | Owner | Status | Est | Blockers |
|---|---|---|---|---|---|
| 0 | Next.js scaffold (`src/`) | Ethan | 🟢 | 1.5h | none |
| 1 | Geocoding + aerial acquisition CLI | Dan | 🟢 | 1h | none |
| 2 | Pitch estimation prompt | Will | 🟢 | 1.5h | #1 |
| 3 | Footprint + line items prompt | Will | 🟢 | 2h | #1 |
| 4 | Calibration harness against examples | Dan | 🟢 | 1h | #2, #3 |
| 5 | Materials catalog (3 tiers, real prices) | Ethan | 🟢 | 1h | none |
| 6 | Estimate calculator | Eric | 🟢 | 1h | #5 |
| 7 | PDF template + renderer | Dan | 🟢 | 2h | #6 |
| 8 | Single-command CLI runner | Dan | 🟢 | 1h | #1, #4, #7 |
| 9 | Run pipeline on 5 example properties (calibrate) | Dan | 🟢 | 1h | #8 |
| 10 | Iterate prompts (PLOG-005 Solar fence) | Dan | 🟢 | 2h | #9 |
| 11 | Run pipeline on 5 test properties (Solar-fenced) | Dan | 🟢 | 1h | #10 |
| 12 | Final cross-check + form submission | | ⚪ | 0.5h | #11 |
| 13 | Repo polish (README, code cleanup, demo prep) | | ⚪ | 1h | #11 |
| 14 | Customer intake question taxonomy + tracking schema | | ⚪ | 0.5h | none |
| 15 | Solar fence threshold tuning / second prompt iteration | | ⚪ | 1-2h | none |
| 16 | PDF download via API route from Roof Recon UI | Dan | 🟢 | 0.5h | none |
| 17 | Demo script + rehearsal (for finalist round) | | ⚪ | 1h | none |

**Critical path:** 1 → 2/3 (parallel) → 4 → 9 → 10 → 11 → 12 = ~9 hours sequential.
**Parallel work:** 5 → 6 → 7 (~4 hours, no critical-path conflict).

## Suggested first picks

- **Dan:** #1 (geocoding + aerial), then #2 (pitch prompt)
- **Will:** #3 (footprint + line items prompt) — pair with Dan on #2 if helpful
- **Eric:** #5 (materials catalog) → #6 (estimate calc) → #7 (PDF) — full estimate pipeline
- **Ethan:** help with #5 (catalog research, real prices), then assist with #13 (repo polish)

After ~3 hours: pipeline runs end-to-end on one address. Then it's calibration, calibration, calibration.

---

## Tasks (detail)

### 1. Geocoding + aerial acquisition CLI

**Goal:** `node scripts/fetch-aerial.mjs "21106 Kenswick Meadows Ct, Humble, TX 77338"` produces `intermediate/<slug>/geocode.json` and `intermediate/<slug>/aerial.jpg`.

**Steps:**
- Sign up for Google Maps API key (or use Mapbox if Google billing is friction)
- Geocoding API: address → lat/lng + formatted address
- Static Maps API: lat/lng → satellite image at zoom 20, size 640x640, scale=2 (effectively 1280x1280)
- Save image as JPEG, save geocode response as JSON
- Slug = lowercase address with non-alphanumeric → hyphens

**Test:** runs cleanly on all 5 example properties + all 5 test properties.

**Output:** images cached in `intermediate/`, no API hits on re-runs.

---

### 2. Pitch estimation prompt

**Goal:** given `intermediate/<slug>/aerial.jpg`, predict roof pitch (e.g. "6:12") with confidence.

**Steps:**
- Claude Sonnet vision call with the prompt sketch in `architecture.md`
- Output: `intermediate/<slug>/vision-pitch.json` with `{ pitch, confidence, rationale }`
- Test on the 5 example properties — references give us pitch ground truth (4:12, 6:12, 8:12)

**Goal accuracy:** within 1 step (e.g. predict 6:12 when truth is 7:12 is OK; predict 4:12 when truth is 8:12 is not).

**Iteration loop:**
- Run on examples
- Compare predictions vs reference pitches
- Adjust prompt
- Re-run

---

### 3. Footprint + line items prompt

**Goal:** given `intermediate/<slug>/aerial.jpg`, predict footprint sqft + linear-feet for ridge/hip/valley/rake/eave.

**Steps:**
- Claude Sonnet vision call with the prompt sketch in `architecture.md`
- Critical: image scale must be communicated — at Google Static Maps zoom 20, scale 2, the meters-per-pixel is roughly `156543.03 × cos(latitude) / 2^20 / 2`. At Houston (29.5°N) ≈ 0.13 m/px ≈ 0.42 ft/px.
- Provide the scale factor in the prompt
- Output: `intermediate/<slug>/vision-area.json` with `{ footprint_sqft, line_items: {...}, confidence, rationale }`

**Iteration loop:**
- Run on examples
- Footprint × pitch_multiplier should land in [Ref A, Ref B] envelope
- Linear-feet line items should be plausible (eaves ≥ 100ft for residential typical)
- Adjust prompt; consider showing the model the scale bar visually

---

### 4. Calibration harness against examples

**Goal:** `npm run calibrate` runs the full pipeline on all 5 example properties and prints a deviation table.

**Output:**
```
Property                    | Predicted | Ref A | Ref B | Avg  | Δ%
21106 Kenswick Meadows Ct   | 2,510     | 2,443 | 2,343 | 2393 | +4.9%
5914 Copper Lilly Lane      | 4,300     | 4,391 | 4,296 | 4344 | -1.0%
122 NW 13th Ave             | ...
```

**Goal:** all 5 within ±10% of reference average. Better is better.

---

### 5. Materials catalog (3 tiers, real prices)

**Goal:** `data/materials.json` populated with the 3-tier structure from `architecture.md`. Real product names, real-ish prices.

**Sources:**
- Manufacturer spec sheets (public)
- Home Depot / Lowes for ballpark per-square prices
- Contractor pricing forums (r/Roofing, ContractorTalk) for labor + accessories
- Cite each price source as a comment in the JSON or a `sources.md`

---

### 6. Estimate calculator

**Goal:** given a measurement (sqft + line items), produce a priced bid.

**Steps:**
- `src/lib/estimate.ts` exports `estimate(measurement, materials, options) → BidResult`
- Computes: material cost (squares × cost/sq), labor (squares × hours × rate), accessories (underlayment, drip edge, ridge cap based on linear-feet)
- Returns 3 tier variants: standard, premium, luxury
- Pure function, easy to unit test

---

### 7. PDF template + renderer

**Goal:** branded customer-ready estimate PDF.

**Steps:**
- HTML template (Tailwind for styling) — header/customer block/property block with aerial thumbnail/line items table/totals/signature line
- Puppeteer renders to PDF
- Three tiers shown side by side OR one tier per page; design choice
- Output: `outputs/<slug>/estimate.pdf`

---

### 8. Single-command CLI runner

**Goal:** `npm run estimate -- "address"` runs the entire pipeline and writes `outputs/<slug>/`.

**Steps:**
- `scripts/estimate.mjs` orchestrates: geocode → aerial → pitch → footprint → estimate → PDF
- Writes all intermediate files for inspection
- Idempotent: re-running uses cached aerial + cached vision calls if present (with `--no-cache` flag to force refresh)

---

### 9. Run pipeline on 5 example properties (calibrate)

**Goal:** baseline calibration numbers.

**Steps:**
- Run `npm run estimate` on all 5 example addresses
- Record predicted vs reference in `benchmarks/calibration-results.md`
- Identify which properties are inside ±10%, which are outside

---

### 10. Iterate prompts to hit ±10% on examples

**Goal:** all 5 example properties within ±10% of reference average.

**Steps:**
- Look at the failing properties; figure out what the model missed
- Adjust pitch prompt or area prompt accordingly
- Re-run calibration
- Repeat until calibrated

**Time-box:** 2 hours. If we can't hit ±10% in 2 hours, accept what we have and move on.

---

### 11. Run pipeline on 5 test properties

**Goal:** final numbers for submission.

**Steps:**
- Run `npm run estimate` on all 5 test addresses
- Update `benchmarks/test-properties.md` with predicted sqft + pitch
- Cache the outputs in `outputs/`

---

### 12. Final cross-check + form submission

**Goal:** numbers submitted by 1:30 PM.

**Steps:**
- Re-run example calibration one final time — confirm we haven't regressed
- Sanity-check test-property numbers against parcel sqft (where pulled) — should be order-of-magnitude reasonable
- Open form: https://docs.google.com/forms/d/e/1FAIpQLSfTL58Z0rVBgfx9l81lV7GpryhF7kDEuFKCgNG5i-m1RWDyUg/viewform
- Fill out: team name, members, approach summary (≤200 words), phone (for finalist text), repo URL, 5 sqft numbers, optional best output URL
- Submit
- Take a screenshot of confirmation

---

### 13. Repo polish (README, code cleanup, demo prep)

**Goal:** the public repo is something we'd want judges to see.

**Steps:**
- README is clear, accurate, runnable
- No commented-out garbage, no debug logs in committed code
- License/attribution clean
- A short demo script for if we make finals (5 min + Q&A)
- One screenshot or short video of the tool running, embedded in README

---

### 14. Customer intake question taxonomy + tracking schema

**Goal:** track critical roofer-to-homeowner discovery questions in a reusable format for app/CLI estimate flows.

**Steps:**
- Create a canonical taxonomy doc: `docs/customer-intake-questions.md`
- Create machine-readable schema: `data/intake-question-types.json`
- Mark minimum required fields for `final` vs `preliminary` estimates
- Add an estimate-note convention to flag missing intake fields

**Output:**
- Intake question categories and required fields are explicit and versioned in-repo.

---

## Coordination

- **Submission deadline:** Saturday 1:30 PM. Hard.
- **Live finals (if top 5):** 2:00–3:30 PM, on-site at JobNimbus HQ.
- **Awards:** 4:00 PM.
- **Status table at the top is the source of truth.** Update as you claim/finish.
- **The repo is public (slide 8: JN owns submitted IP).** Treat everything in it as code we're handing JN. No NBD Labs prompts, no proprietary patterns.
- **Build, don't buy.** No commercial measurement APIs (EagleView, Geospan, Hover, Roofr Instant Estimator). Computation must be visible in the repo.
- **Don't fabricate.** Submitted numbers can be cross-checked.
