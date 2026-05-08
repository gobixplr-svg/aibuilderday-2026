# End-to-End: What "Done" Looks Like

> Written 2026-05-08, ~13 hours before the 1:30 PM Saturday submission deadline. Read this before iterating prompts or polishing UI — we need to be aligned on what we're submitting.

## The submission has two parts

### Part A — the form (the only thing JobNimbus actually grades)

**What:** [Google Form](https://docs.google.com/forms/d/e/1FAIpQLSfTL58Z0rVBgfx9l81lV7GpryhF7kDEuFKCgNG5i-m1RWDyUg/viewform), submitted by Saturday 1:30 PM.

**Form requires:**

1. Team name + members (max 3 — **we have 4. Need to drop one or pick the credited 3.**)
2. Approach summary (≤200 words)
3. Phone number (top 5 finalists texted at 2:00 PM)
4. Public GitHub repo URL → `https://github.com/gobixplr-svg/aibuilderday-2026`
5. **Total sqft for each of the 5 test properties** (this is the score)
6. Optional: best example output URL, demo video link

**The 5 test sqft numbers are the only hard deliverable.** Everything else is signal toward the optional finalist round.

### Part B — the GitHub repo (judges + the AI scoring agent will look)

**Required:**
- `README.md` — what the tool does, how to run it
- Source code that **shows the computation** (no commercial-API black-boxing)
- Per-property output (PDF / JSON / screenshot) for each test address

**Status: ✅ all of these exist.**

## Three audiences

The repo is doing triple duty. Knowing which audience you're optimizing for changes what to polish.

| Audience | What they want | Where they spend time |
|---|---|---|
| **Preliminary AI scoring agent** (1:30-2:00 PM) | sqft accuracy, repo legibility, evidence of computation | the form numbers, the README, code structure |
| **Top-5 live demo judges** (2:00-3:30 PM, only if we make finals) | a story, a working demo, "would a roofer actually use this?" | the live demo (5 min + Q&A) |
| **Tyler Folkman / JN engineering** (whenever) | technical credibility, "this team is hireable / acquirable" | code quality, the PLOG, architecture decisions |

**The Roof Recon UI is for the live finals demo. The CLI + outputs are for everyone.**

## Current end-to-end flow

```
┌──────────────────────────────────────────────────────────────┐
│ Address in (CLI or web UI)                                    │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ scripts/lib/aerial-pipeline.mjs                              │
│   Geocode (Google preferred, Census/Nominatim fallback)      │
│   Fetch aerial (Google Static Maps OR Esri World Imagery)    │
│   → intermediate/<slug>/{aerial.jpg, geocode.json, meta.json}│
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ scripts/lib/scale-bar.mjs                                    │
│   Annotate: 50ft scale bar + N arrow (overlaid SVG)          │
│   → intermediate/<slug>/aerial-annotated.jpg                 │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼ (parallel — PLOG-002)
┌──────────────────────┬───────────────────────────────────────┐
│ pitch.mjs            │ footprint.mjs                         │
│ Claude Sonnet vision │ Claude Sonnet vision                  │
│ → vision-pitch.json  │ → vision-area.json                    │
│   { pitch,           │   { footprint_sqft, line_items,       │
│     confidence }     │     confidence }                      │
└──────────────────────┴───────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ Roof area = footprint_sqft × pitch_multiplier                │
│ → measurement.json                                            │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ scripts/lib/estimate-engine.mjs (Eric)                       │
│   Wrapped by lib/estimate.mjs adapter                        │
│   3 tier calls (Standard / Premium / Luxury)                 │
│   → estimate.json                                             │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ scripts/lib/pdf.mjs (Puppeteer + pdf-template.mjs)           │
│   → outputs/<slug>/{measurement.json, estimate.json,         │
│                     estimate.pdf, estimate.html, aerial.jpg} │
└──────────────────────────────────────────────────────────────┘
```

**Two entrypoints both use the same pipeline:**

- **CLI:** `npm run estimate -- "<address>"` → outputs/
- **Web UI** (`/api/measure`): RoofRecon → spawns same CLI with `--no-cache` → outputs/

## Definition of done — for each layer

### Submission form (the must-have)

- [x] 5 test properties have aerial.jpg cached
- [ ] **5 test properties have measurement.json with a real sqft (4 of 5 missing — only Thornton CO has run end-to-end)**
- [ ] sqft entered in the form by 1:30 PM Saturday
- [ ] Team selected (3 names, since the form caps at 3)
- [ ] Approach summary drafted (≤200 words)
- [ ] Phone number ready

### Public repo (the credibility layer)

- [x] Public on GitHub
- [x] README explains what + how
- [x] Source code shows computation (vision prompts + math, not API hand-off)
- [x] data/materials.json with sourced prices
- [x] PLOG demonstrating systematic iteration (signal of engineering rigor)
- [ ] **Outputs for all 5 test properties committed**
- [ ] **Outputs for all 5 example properties committed (4 of 5 done — Orland Park missing)**
- [ ] README's "How to run" verified to work on a fresh clone

### Roof Recon UI (the demo layer — only matters if we make top 5)

- [x] Wired to real pipeline via /api/measure
- [x] Three states designed (idle, processing, result) with distinctive aesthetic
- [x] Quick-fill addresses are the 5 example properties (good for demo familiarity)
- [ ] **Verified end-to-end on a real address from a fresh `npm run dev`**
- [ ] **Decision: which test property is the demo address?** (judges will likely watch us scan one in real time)
- [ ] **Demo script** — 5-minute narrative arc with cue points
- [ ] PDF download path from the UI (right now PDF lives in outputs/, not exposed in UI)
- [ ] Error states tested (bad address, API timeout, etc.)

## Where end-to-end is breaking right now

### Bug-class issues

1. **`/api/measure` 120s timeout vs ~3:41 actual pipeline runtime.** Will dropped `effort: high → medium` to help, but this is brittle. A complex roof on demo day may exceed 120s. **Fix candidate:** raise to 300s, or stream progress via SSE so the UI doesn't time out.
2. **Two API routes** (`/api/estimate` legacy + `/api/measure` current). One should be deleted to avoid confusion when judges grep the repo.
3. **Roof Recon's processing screen has fake-looking pipeline steps** (`PIPELINE` array at lines 22-28). The `at: N seconds` timing assumes 50s total, but real runs are 90-220s. **The progress bar lies.** Either pull real status from the API or remove the timed steps.

### Accuracy issues

4. **2 of 5 example properties in tolerance.** Submitting now means three known-bad numbers in the form. PLOG-001 baseline accuracy was actually better than current (Property 1: −1.9% on `effort: high` → −8.9% on `medium`). The dropped effort wasn't logged in the PLOG.
5. **Pitch model unreliable.** 1 of 5 correct. Pitch-multiplier errors compound footprint errors.
6. **Footprint chronically under-traces.** −16% to −43% on 4 of 5 examples.

### Process issues

7. **5 of 10 JobNimbus properties haven't run end-to-end.** All have aerials cached, but only Thornton CO of the 5 *test* properties has measurement.json. **This is the biggest single gap.**
8. **One non-JobNimbus property** (Saratoga Springs UT) shows up in outputs/. Probably Eric spot-checking. Should be deleted before submission so judges don't wonder why we ran an extra address.
9. **PLOG entries inconsistent.** PLOG-002 logged. The `effort: high → medium` change wasn't.

## What I'd prioritize between now and 1:30 PM tomorrow

In order:

1. **Run the 4 missing test properties end-to-end.** Without these, we have no submission. Fast and obvious.
2. **Decide: submit current numbers, or try one more prompt iteration?** Current numbers will likely score "OK" — we're 2 of 5 in tolerance on examples. One more prompt iteration could move that to 4 of 5, but eats hours and risks breaking what works. Time-box this to 90 minutes.
3. **Tighten the demo script** for the live finals slot. Pick a single test property (probably Thornton CO since it's already run), rehearse a 5-minute narrative.
4. **Clean the repo for the AI scoring agent.** README walkthrough + remove stray Saratoga property.
5. **Pick the 3 form members.** Awkward but the form caps it.

## What we DON'T need to do

- **Win the live finals** — we're optimizing for advancing to top 5 (form score) first, then for a credible demo if we get there. Getting greedy on demo polish before the form is filled is the wrong order.
- **Add JobNimbus API integration** — out of scope; not something the bounty asks for.
- **More UI polish** — Roof Recon already looks distinctive enough to be memorable.
- **Calibrate every variation of prompts** — diminishing returns. One focused iteration is worth more than five small ones.
