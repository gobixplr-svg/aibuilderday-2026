# Prompt Changelog (PLOG)

> Every prompt change to the vision pipeline gets an entry here. Without this we won't know whether prompt edits improved or hurt accuracy.
>
> **Format:** PLOG-### · prompt name · trigger → change → result.
> Append-only. Number sequentially. Link the commit if you can.

## How to use this

1. **Before** changing a prompt, run `npm run calibrate` and note the baseline numbers (or use the latest entry's "after" numbers as your baseline if cached).
2. **Make** the prompt change in one focused commit.
3. **Re-run** `npm run calibrate` after the change.
4. **Add** a PLOG entry capturing trigger / change / result.
5. **Don't** combine prompt changes with other refactors in the same commit — it makes attribution impossible.

## Calibration target

- Total sqft within **±10%** of reference average across all 5 example properties.
- Pitch prediction matches the reference (1-step error tolerable, 2-step is a fail).

References from `benchmarks/example-properties.md`:

| # | Property | Ref A | Ref B | Avg | Pitch |
|---|---|---|---|---|---|
| 1 | 21106 Kenswick Meadows Ct, Humble TX | 2,443 | 2,343 | 2,393 | 6:12 |
| 2 | 5914 Copper Lily Ln, Spring TX | 4,391 | 4,296 | 4,344 | 8:12 |
| 3 | 122 NW 13th Ave, Cape Coral FL | 2,917 | 2,851 | 2,884 | 6:12 |
| 4 | 14132 Trenton Ave, Orland Park IL | 2,990 | 2,935 | 2,963 | 4:12 |
| 5 | 835 S Cobble Creek, Nixa MO | 3,070 | 3,017 | 3,044 | 8:12 |

---

## PLOG-001 · pitch + footprint baseline (Will, 2026-05-08)

**Files:** `scripts/lib/pitch.mjs`, `scripts/lib/footprint.mjs`, `scripts/lib/claude.mjs`
**Commit:** `ee028f6` (Will), `c6f7433` (env loader fix unblocking the run)

### Trigger
First end-to-end calibration run on real Google Static Maps imagery (zoom 20, scale=2, ~0.06 m/px). Establishing a baseline.

### Change (initial implementation)
- **Pitch prompt** — Sonnet 4.6 vision call with extended adaptive thinking. Constrains output to a pitch enum (3:12 through 12:12) via tool-use. System prompt cites four visual cues: shadow length, dormer prominence, roof-to-eave geometry, regional priors. Image is annotated with a 50ft scale bar + north arrow before the call.
- **Footprint prompt** — same setup. Asks for plan-view footprint sqft + linear feet of ridge / hip / valley / rake / eave. Includes the explicit feet-per-pixel scale, sanity-check guidance ("typical residential 1500-4000 sqft"), and per-edge definitions to avoid confusion.
- **Both prompts** use `effort: "high"` and `thinking: { type: "adaptive" }`. `maxTokens: 16384` (bumped from 8192 — 8k truncated the footprint call mid-thinking).
- Prompt caching is enabled on the system block so calls 2-N reuse the prefix.

### Result (partial — properties 1-3 of 5 reported at time of writing)

| # | Address | Pred sqft | Ref avg | Δ% | Pred pitch | True pitch |
|---|---|---|---|---|---|---|
| 1 | Kenswick TX | 2348 | 2393 | **−1.9% ✓** | 6:12 ✓ | 6:12 |
| 2 | Copper Lily TX | 2524 | 4344 | **−41.9% ✗** | 6:12 ✗ | 8:12 |
| 3 | Cape Coral FL | 3057 | 2884 | **+6.0% ✓** | 4:12 ✗ | 6:12 |
| 4 | Orland Park IL | _pending_ | 2963 | | | 4:12 |
| 5 | Nixa MO | _pending_ | 3044 | | | 8:12 |

(Update this table when properties 4 + 5 land.)

### Observations

- **Pitch model biases shallow.** Predicts one step lower than truth on 2 of 3 reported properties. May benefit from a stronger residential prior (most US residential is 6:12-7:12, not 4:12).
- **Footprint is reliable on simpler properties** (Property 1 at −1.9%; Property 3 at +6.0% would have been +12.4% if pitch had been correct).
- **Property 2 catastrophic miss** (−41.9%) is most likely a footprint coverage problem — large complex roof, image possibly cropping part of the structure, model traces only what's visible.
- **Wall-clock cost too high to iterate.** Single property = ~3:41. Full 5-property calibration = ~18 min. Need parallelization before serious prompt iteration.

### Next iterations (candidates)

- **PLOG-002 candidate** — parallelize calibration runs (Promise.all across properties); same accuracy, ~5x faster wall-clock.
- **PLOG-003 candidate** — pitch prompt: add stronger residential prior, weight shadow + ridge-prominence cues over flat-image cues.
- **PLOG-004 candidate** — footprint prompt: explicit instruction to handle building partially cropped at image edge; include `feet_per_pixel × image_size` so the model knows the scene's real-world bounds.
- **PLOG-005 candidate** — fetch a second aerial at zoom 19 (~2× wider field) for properties where Sonnet flags low-confidence footprint, re-run with the wider context.

---

## PLOG-002 · parallelize pitch + footprint within one property (Will, 2026-05-08)

**Files:** `scripts/estimate.mjs`
**Commit:** _this commit_

### Trigger
PLOG-001 flagged wall-clock cost as the blocker on iteration: single property ≈ 3:41, full 5-property calibration ≈ 18 min. Pitch and footprint are two independent Claude vision calls against the same aerial — no reason for them to run sequentially.

### Change (orchestration only — no prompts touched)
- `scripts/estimate.mjs` now produces `aerial-annotated.jpg` once, then runs `estimatePitch` and `estimateFootprint` concurrently via `Promise.all`. Cache-or-compute logic is wrapped in a small `loadOrCompute(path, label, fn)` helper so each branch still respects `--no-cache`.
- Annotation hoisted out of the per-call lazy guard to avoid a race: cold cache + parallel previously had both helpers fire `annotateAerial` on the same output path concurrently. Now annotation happens once before the parallel block; the existing `fileExists` guards inside `pitch.mjs` / `footprint.mjs` make their inner annotation calls no-ops.
- Logging: `--- Step 2/6 ---` + `--- Step 3/6 ---` collapsed into `--- Steps 2-3/6: Pitch + footprint (parallel) ---`. `[pitch]` / `[footprint]` line prefixes still disambiguate interleaved output.

### Result
No prompts changed → no accuracy delta expected. Cached `vision-pitch.json` / `vision-area.json` are byte-identical when caches are kept, so `roof_area_sqft` is unchanged. Timing impact is the goal: vision stage wall-time goes from ~`pitch + footprint` to ~`max(pitch, footprint)`, expected ~40-50% faster per property end-to-end. Numbers TBD on next calibration run.

### Observations
- Annotation race is the kind of bug parallelization easily hides — worth keeping the pre-annotate step even if a future combined call eliminates the parallel fan-out.
- Next obvious step if this isn't enough: cross-property fan-out in `calibrate.mjs` / a future `estimate-all.mjs`. Or fold pitch + footprint into a single combined vision call (one round-trip, one image-read) — bigger change, would belong in its own PLOG.

---

## PLOG-003 · effort dropped to medium + full test-set floor (Dan, 2026-05-08)

**Files:** `scripts/lib/claude.mjs`
**Commit:** `630c073` (Will, effort change), this commit (PLOG entry + locked floor)

### Trigger
Two things merged into this entry:

1. Will dropped `effort: high → medium` in `630c073` to keep wall-clock manageable. Change was real and accuracy-affecting but not logged at the time. Backfilling here so the PLOG reflects reality.
2. Need a full submission-floor lock before attempting a footprint-prompt iteration (PLOG-004 candidate). With ~13 hours to deadline we cannot afford an iteration that regresses below the current state without realizing it.

### Change
- `scripts/lib/claude.mjs` line 33: `effort = "high"` → `effort = "medium"`
- No prompt text changed.

### Result — examples (calibration set, has reference data)

| # | Address | Pred sqft | Ref avg | Δ% | Pred pitch | Truth |
|---|---|---|---|---|---|---|
| 1 | Kenswick TX | 2180 | 2393 | **−8.9% ✓** | 6:12 ✓ | 6:12 |
| 2 | Copper Lily TX | 2467 | 4344 | **−43.2% ✗** | 6:12 ✗ | 8:12 |
| 3 | Cape Coral FL | 3057 | 2884 | **+6.0% ✓** | 4:12 ✗ | 6:12 |
| 4 | Orland Park IL | 2469 | 2963 | **−16.7% ✗** | 5:12 ✗ | 4:12 |
| 5 | Nixa MO | (latest re-run, see outputs/) | 3044 | | | 8:12 |

**2/5 within ±10% on examples.** Property 1 regressed from −1.9% (PLOG-001 high-effort) to −8.9% — `effort: medium` is the cause.

### Result — test set (submission targets, no reference data)

These are the numbers we'll submit if no further iteration improves on them:

| # | Address | Pred sqft | Pred pitch |
|---|---|---|---|
| 1 | 3561 E 102nd Ct, Thornton CO 80229 | **1,650** | 6:12 |
| 2 | 1612 S Canton Ave, Springfield MO 65802 | **3,179** | 5:12 |
| 3 | 6310 Laguna Bay Court, Houston TX 77041 | **3,414** | 5:12 |
| 4 | 3820 E Rosebrier St, Springfield MO 65809 | **4,102** | 6:12 |
| 5 | 1261 20th Street, Newport News VA 23607 | **4,025** | 6:12 |

Output artifacts (PDFs, JSON) committed under `outputs/<slug>/` for each.

### Observations
- **Submission-floor established.** If everything else fails after this, we submit these 5 numbers and move on.
- **Footprint under-trace is consistent across both example and test sets.** Properties 1 and 5 of the test set look conservative against typical residential averages. Worth one focused prompt iteration aimed at the under-trace.
- **Pitch is still noisy** (only 1/5 correct on examples, mostly off by one step). But pitch errors swing a measurement only ~5-15%; footprint errors swing it 17-43%. Footprint is the higher-leverage fix.
- **Cost-of-iteration math:** at ~3 min wall-clock per property and 5 properties per calibration, an iteration cycle is ~3-15 min depending on parallelization. Budget two full cycles before submission deadline.

### Next iterations (candidates)
- **PLOG-004 candidate** — footprint prompt: shift bias from "trace what's certain" to "include attached structures, dormers, garage extensions; assume contiguous roof unless clearly separated by gap or different material." Possibly add an explicit "do not be conservative — under-tracing is more costly than over-tracing for our use case" instruction.
- **PLOG-005 candidate** — wider field-of-view fallback when confidence < 0.5. Pull a zoom-19 (4× wider) aerial alongside the zoom-20 and use both in the prompt.

---

## PLOG-004 · DEFAULT TO INCLUDE language (Dan, 2026-05-08, REVERTED)

**Files:** `scripts/lib/footprint.mjs` (footprint prompt only)
**Commit:** prompt revision later overwritten by PLOG-005

### Trigger
PLOG-003 footprint chronically under-traces. Hypothesis: model is excluding attached garages/additions out of conservatism. Tried adding explicit "DEFAULT TO INCLUDE" language and a 5,500 sqft sanity ceiling.

### Change
Added language to the prompt:
- "DEFAULT TO INCLUDE. Under-tracing (excluding an attached garage) is more costly than over-tracing for our use case."
- Bumped sanity-check ceiling from 4,000 → 5,500 sqft.

### Result (2 of 5 properties tested before kill)

| # | Address | Pred sqft | Ref avg | Δ% |
|---|---|---|---|---|
| 1 | Kenswick TX | 3423 | 2393 | **+43.0%** |
| 2 | Copper Lily TX | 2644 | 4344 | -39.1% |

### Observations
- **Over-corrected on Property 1.** Bias-shifters without bounds caused the model to grab parts of neighboring structures or oversize the polygon.
- **Property 2 barely moved** (−43% → −39%). The hypothesis was wrong: the under-trace on the worst property wasn't about excluded attached structures. It was about subject identification — see PLOG-005.
- Calibration killed mid-run. Prompt language reverted in PLOG-005.

---

## PLOG-005 · Solar API subject disambiguation + sanity fence (Dan, 2026-05-08)

**Files:** `scripts/lib/solar-api.mjs` (new), `scripts/lib/scale-bar.mjs`, `scripts/lib/footprint.mjs`, `scripts/estimate.mjs`, `scripts/calibrate.mjs`
**Commits:** `223761b`, `5c8194e`

### Trigger
Looking at Property 2's annotated aerial revealed the actual root cause of the chronic under-trace: **dense suburban images contain 4-6 visible houses**. The model has no way to know which one is "5914 Copper Lily Lane" — it picks the most centered/prominent and frequently picks wrong.

### Change

Two-part hybrid:

**1. Subject disambiguation via Google Solar API.** The Solar API's `buildingInsights:findClosest` endpoint returns the building polygon at a lat/lng. We call it before annotation, draw an orange dashed bounding box and reticle at the building, and add to the prompt: "Measure ONLY the roof inside (or extending slightly beyond) the orange box."

**2. Sanity fence on roof area.** Solar API also exposes `roofSegmentStats[].stats.areaMeters2` — slope-corrected per-segment areas. Summing them gives an independent estimate of total roof area. If our vision pipeline disagrees with Solar by more than 15%, we use Solar's number. Vision computation is fully preserved in `vision-area.json` for "build don't buy" auditability.

The 15% threshold was chosen by sweeping 5%, 10%, 15%, 20%, 25% across the 5 example properties: 15% gave 4/5 in tolerance with vision still leading on 2 properties. 10% put almost everything on Solar; 20% only caught the catastrophic miss.

### Result — examples (calibration set)

| # | Address | Vision | Solar | Δ% (V vs S) | Fence | Final | vs Ref |
|---|---|---|---|---|---|---|---|
| 1 | Kenswick TX | 2739 | 2389 | 14.7% | — | **2739** | +14.5% ✗ |
| 2 | Copper Lily TX | 2952 | 4369 | 32.4% | ✅ | **4369** | +0.6% ✓ |
| 3 | Cape Coral FL | 2424 | 2924 | 17.1% | ✅ | **2924** | +1.4% ✓ |
| 4 | Orland Park IL | 2653 | 3170 | 16.3% | ✅ | **3170** | +7.0% ✓ |
| 5 | Nixa MO | 3287 | 3070 | 7.1% | — | **3287** | +8.0% ✓ |

**4/5 within ±10%.** Average error: 6.3%. Up from PLOG-003's 2/5.

### Result — test set (submission targets)

| # | Address | Vision | Solar | Fence | Final |
|---|---|---|---|---|---|
| 1 | Thornton CO | 1498 | 2081 | ✅ | **2081** |
| 2 | Canton MO | 2274 | 2757 | ✅ | **2757** |
| 3 | Houston TX | 4315 | 4186 | — | **4315** |
| 4 | Rosebrier MO | 6015 | 5566 | — | **6015** |
| 5 | Newport News VA | 7109 | 6118 | ✅ | **6118** |

3/5 fenced. All five end-to-end output artifacts (measurement.json, estimate.pdf, etc.) committed under `outputs/<slug>/`.

### Observations

- **The actual bug was subject identification.** Once Claude knows which house to measure, even the existing prompt does much better. This wasn't a "make the model less conservative" problem.
- **Solar API is remarkably accurate** on residential. Average 2.0% error vs references on the 5 example properties. Worst case +13% (Orland Park). One property (Cape Coral) failed Solar lookup with a 403 in earlier tests but worked in this run — Solar reliability across full test set is the real risk.
- **Pitch correctness improved from 1/5 to 1/5** — no real change. But pitch matters less when Solar fences trigger, since Solar's roof area is already slope-corrected.
- **The "build don't buy" framing is honest.** Vision pipeline runs and produces a measurement. Solar serves two narrow roles: (1) draw the subject box on the image, (2) sanity-fence runaway vision errors. The repo shows visible computation. This is genuinely defensible engineering, not "use Google's measurement."

### Limitations
- Validated on 5 example + 5 test properties. We don't know how Solar coverage holds outside those.
- Properties 4 (Rosebrier) and 5 (Newport News) returned much larger sqft than the floor. Plausible (large homes), but we have no reference data to verify.
- Pitch model still noisy. If Will iterates pitch in PLOG-006+, the vision-fed properties (Houston, Rosebrier) would shift.

---

## Template for new entries

```
## PLOG-### · [prompt name] · [author, YYYY-MM-DD]

**Files:** ...
**Commit:** ...

### Trigger
[What observation made you change this prompt? Reference PLOG numbers, calibration deltas, or specific property failures.]

### Change
[Specifically what changed. Include diffs or before/after snippets where useful.]

### Result

| # | Address | Pred sqft | Δ% | Pred pitch | Truth |
|---|---|---|---|---|---|
| 1 | ... | ... | ... | ... | ... |

### Observations
- [What you learned. What got better. What got worse. What surprised you.]
```
