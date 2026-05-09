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

## Current submission set (PLOG-006, ready to submit)

| # | Property | Final sqft | Source | Pitch |
|---|---|---|---|---|
| 1 | 3561 E 102nd Ct, Thornton CO 80229 | **2,081** | Solar-fenced | 6:12 |
| 2 | 1612 S Canton Ave, Springfield MO 65802 | **2,757** | Solar-fenced | 5:12 |
| 3 | 6310 Laguna Bay Court, Houston TX 77041 | **4,315** | Vision | 5:12 |
| 4 | 3820 E Rosebrier St, Springfield MO 65809 | **6,015** | Vision | 6:12 |
| 5 | 1261 20th Street, Newport News VA 23607 | **6,118** | Solar-fenced | 6:12 |

Calibration on 5 example properties (PLOG-006, fence threshold 12%): **5/5 within ±10%, 3.4% avg error.** Worst case is Nixa at +8.0%. Test set numbers unchanged from PLOG-005 — the threshold tightening only flipped one example property (Kenswick, +14.5% → −0.2%) without touching any submission number.

## Status of original concerns (resolved during this session)

- ✅ All 5 test properties have full pipeline output committed in `outputs/<slug>/`.
- ✅ PDF download wired in UI (`/api/pdf?address=<addr>` route + button).
- ✅ Subject identification fixed via Solar API marker overlay (the actual root cause of the under-trace).
- ✅ PLOG entries 1-5 logged. Effort change is documented in PLOG-003.

## Saturday morning playbook (in order — no thinking required)

> All quality + UI work shipped overnight. What's left is paperwork and a Loom video. Target submit time: 1:00 PM (30-min buffer). Hard deadline 1:30 PM.

### Step 1 — Pre-submission verification (~10 min, ~9:00 AM)

- [ ] Open https://github.com/gobixplr-svg/aibuilderday-2026 in a fresh incognito window. Verify README renders cleanly, JUDGES.md is at repo root, the Kenswick annotated aerial loads in the README hero.
- [ ] Re-run `npm run calibrate` locally. Verify the output ends with `5/5 within ±10%` and `✓ all properties in tolerance`. (If it doesn't — STOP and debug. The PLOG-006 floor is the floor.)
- [ ] Open the Google Form once *without* submitting to confirm what fields it actually asks for. Note whether "Edit after submit" is on (probably is by default).

### Step 2 — Approach summary (~30 min, ~9:30 AM)

Draft the ≤200-word summary. Lift directly from the README and JUDGES.md — no new prose required. Suggested skeleton:

> Roof Recon takes a property address and produces a roof measurement (sqft + line items) and a 3-tier priced estimate PDF in ~3 minutes. The cost wedge: ~$0.20 per measurement vs $15–87 for incumbents.
>
> The pipeline is: Google Geocode → Static Maps zoom 20 → Google Solar API for the subject building's polygon → annotate the aerial with an orange SUBJECT box → Claude Sonnet 4.6 vision (parallel calls for pitch and footprint) → roof_area = footprint × pitch_multiplier → Solar fence (use Solar's slope-corrected segment area when vision disagrees by >12%) → Eric's pure-function estimate engine → branded PDF.
>
> The novel piece is the Solar fence. Naive "address → vision LLM" fails on dense suburbs because the model can't tell which of 9 visible houses is the subject. Solar API's buildingInsights gives us the subject polygon for the marker AND a slope-corrected sanity rail. Result: 5/5 example properties in tolerance, 3.4% mean error.
>
> Iteration logged in docs/prompt-changelog.md (PLOG-001 through PLOG-007, including reverts).

Trim to ≤200 words. Save to `docs/submission-summary.md` so it's in the repo.

### Step 3 — Loom video (~20 min, ~10:30 AM)

Why before submission: Google Forms doesn't reliably let you edit after submit. Get the URL first, submit once.

- [ ] Loom desktop app (loom.com → install if not already)
- [ ] macOS: enable Focus mode (no notifications), close Slack/email
- [ ] Browser: zoom Cmd+ to 125%, hide bookmarks bar (Cmd+Shift+B)
- [ ] Open http://localhost:3000 (run `npm run dev` first if needed)
- [ ] One 10-second test recording to check audio level

**Demo script (~75–90 seconds, narrated live):**

1. (0:00–0:10) Idle screen visible. *"Roof Recon. Address in, roof measurement and a priced estimate out, in about three minutes. Built for the JobNimbus AI Builder Day bounty."*
2. (0:10–0:20) Click into address field, paste `3561 E 102nd Ct, Thornton, CO 80229`, click Scan roof. *"This is one of the five test properties. We'll watch it run end to end."*
3. (0:20–0:50) Processing screen shows. Aerial swaps in at ~5s. *"That orange box is the Google Solar API telling us which house is the subject — without it, the model picks one of nine visible roofs and gets it wrong."* Progress bar moves. *"While we wait, two parallel Claude vision calls compute pitch and footprint."*
4. (0:50–1:15) Results appear. *"2,081 square feet, fenced by Solar because vision and Solar disagreed by more than twelve percent. Three priced tiers — Standard, Premium, Luxury — pulled from a real materials catalog with cited prices."*
5. (1:15–1:30) Click PDF download. *"And the contractor-ready PDF. The whole repo is public. Five out of five example properties calibrate within ten percent. Code, prompt changelog, and per-property output are all in the repo."*

If the live run takes too long, do two takes: idle → submit (cut), processing → results (cut), splice with Loom's trim. Aim for one continuous take if possible.

- [ ] Stop recording. Loom auto-uploads. Copy the share URL.

### Step 4 — Submit the form (~10 min, ~11:00 AM)

Form: https://docs.google.com/forms/d/e/1FAIpQLSfTL58Z0rVBgfx9l81lV7GpryhF7kDEuFKCgNG5i-m1RWDyUg/viewform

Fields, in order:

1. **Team name + members:** Dan Elggren, Will Sandburg, Eric Smith. (Form caps at 3. Ethan credited in README but absent Saturday.)
2. **Approach summary** — paste from `docs/submission-summary.md`
3. **Phone number** — Dan's, since he's lead and on-site
4. **GitHub repo URL** — `https://github.com/gobixplr-svg/aibuilderday-2026`
5. **5 test sqft numbers** (in form's order — verify against `benchmark-measurements.md`):
   - 3561 E 102nd Ct, Thornton CO → **2,081**
   - 1612 S Canton Ave, Springfield MO → **2,757**
   - 6310 Laguna Bay Court, Houston TX → **4,315**
   - 3820 E Rosebrier St, Springfield MO → **6,015**
   - 1261 20th Street, Newport News VA → **6,118**
6. **Optional: best example output URL** — pick one of these at form-fill time based on what feels strongest in the moment:
   - **Thornton CO test PDF** (test property, Solar-fenced, smallest/cleanest of the test set):
     `https://github.com/gobixplr-svg/aibuilderday-2026/blob/main/outputs/3561-e-102nd-ct-thornton-co-80229/estimate.pdf`
   - **Kenswick TX example PDF** (has ground truth — judges can verify the −0.2% accuracy directly):
     `https://github.com/gobixplr-svg/aibuilderday-2026/blob/main/outputs/21106-kenswick-meadows-ct-humble-tx-77338/estimate.pdf`
   - **Whole portfolio** (lets judges browse all 10):
     `https://github.com/gobixplr-svg/aibuilderday-2026/tree/main/outputs`
7. **Optional: demo video URL** — Loom URL from Step 3

Hit Submit. Screenshot the confirmation. Done.

### Step 5 — Stand by for finalist text (2:00 PM)

If we make top 5: live demo 2:00–3:30 PM at JN HQ in Lehi. Bring the laptop with the dev server already running on a known-good cached property.

### What's NOT on this list (deliberately)

- More accuracy iteration. PLOG-007 already showed pitch reworks regress more than they help. Floor is locked.
- Repo polish beyond what's already in. Diminishing returns vs. paperwork risk.
- Code changes. Anything that breaks the calibration on submission morning is a self-inflicted disaster.
