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

## Current submission set (PLOG-005, ready to submit)

| # | Property | Final sqft | Source | Pitch |
|---|---|---|---|---|
| 1 | 3561 E 102nd Ct, Thornton CO 80229 | **2,081** | Solar-fenced | 6:12 |
| 2 | 1612 S Canton Ave, Springfield MO 65802 | **2,757** | Solar-fenced | 5:12 |
| 3 | 6310 Laguna Bay Court, Houston TX 77041 | **4,315** | Vision | 5:12 |
| 4 | 3820 E Rosebrier St, Springfield MO 65809 | **6,015** | Vision | 6:12 |
| 5 | 1261 20th Street, Newport News VA 23607 | **6,118** | Solar-fenced | 6:12 |

Calibration on 5 example properties: **4/5 within ±10%, 6.3% avg error.** Worst miss is +14.5% on Kenswick (vision, fence didn't trigger because vision/Solar agree at 14.7%).

## Status of original concerns (resolved during this session)

- ✅ All 5 test properties have full pipeline output committed in `outputs/<slug>/`.
- ✅ PDF download wired in UI (`/api/pdf?address=<addr>` route + button).
- ✅ Subject identification fixed via Solar API marker overlay (the actual root cause of the under-trace).
- ✅ PLOG entries 1-5 logged. Effort change is documented in PLOG-003.

## Open items going into the next session

### Submission paperwork

- [ ] **Team members for the form (max 3):** Dan, Will, Eric. Ethan can't attend Saturday.
- [ ] **Approach summary (≤200 words)** drafted in a doc (haven't done this yet).
- [ ] **Phone number** for the finalist text at 2:00 PM.
- [ ] **README update** to describe the Solar fence approach (the current README is a few iterations old).
- [ ] **Form submission itself** by Saturday 1:30 PM.

### Quality / accuracy

- [ ] **Fence threshold sensitivity.** Currently 15% (4/5 in tolerance). Worth one more sweep with fresh runs to see if Kenswick (the only example miss) responds differently with a refresh. Could also try 12% to see if Kenswick flips.
- [ ] **Pitch is still 1/5 on examples.** Doesn't matter when fence triggers (Solar's number is already slope-corrected) but matters for vision-fed properties (Houston, Rosebrier).
- [ ] **Properties 4 & 5 in test set are very large.** No reference data — could be over-trace. Worth eyeballing the annotated aerials before submission.

### Demo readiness (only if we make finalist round)

- [ ] **Roof Recon's processing screen progress bar lies.** Hardcoded to 50s; real runs are 90-220s. Either fix or remove timed steps.
- [ ] **Demo script** — 5-minute narrative for finalist round.
- [ ] **`/api/measure` 120s timeout** vs typical 3-4 min runtime. Bump to 300s.
- [ ] **Two API routes** (`/api/measure` + `/api/estimate`) — one is legacy, should be deleted.

### Repo hygiene

- [ ] **Saratoga Springs UT** in `outputs/` is non-bounty (Eric spot-check). Delete before submission.
