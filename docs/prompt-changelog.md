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
