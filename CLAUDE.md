# CLAUDE.md — AI Builder Day 2026 / JobNimbus Bounty

> Shared house rules for anyone using Claude Code on this repo. Read before contributing.

## What we're building

A measurement-and-estimate pipeline for residential pitched roofs. Address in → roof measurement (total sqft + line items) + quote-ready estimate PDF out. Five test addresses to submit total sqft for, by Saturday May 9 at 1:30 PM.

**Current pipeline (PLOG-008):**
1. Geocode (Google) → lat/lng
2. Fetch aerial (Google Static Maps zoom 20, 1280px)
3. **Solar API `buildingInsights`** — gets the subject building's polygon
4. Annotate aerial: scale bar + N arrow + **orange bounding box + reticle** at the subject home
5. Parallel Claude Sonnet vision calls: pitch (4:12–12:12 enum) + footprint (sqft + line items)
6. Compute roof area = footprint × pitch_multiplier
7. **Solar fence:** if vision roof area differs from Solar's slope-corrected segment area by >12%, use Solar's number (PLOG-006)
8. **Roof condition assessment:** third Sonnet vision call against the same SUBJECT-annotated aerial → structured pre-inspection observations (PLOG-008)
9. Eric's estimate engine produces 3 priced tiers
10. Puppeteer renders branded PDF (now includes a "Pre-inspection observations" section)

**Calibration result (5 example properties):** 5/5 within ±10%, avg error 3.4%, worst case +8.0%.

**Team:** Dan (lead), Will (vision prompts), Eric (estimate engine). Ethan built the frontend + materials catalog but won't be on-site Saturday.

Brief: [jobnimbus/jobnimbus-hackathon-2026](https://github.com/jobnimbus/jobnimbus-hackathon-2026)
Full architecture: [docs/architecture.md](docs/architecture.md)
End-to-end + Saturday morning submission playbook: [docs/end-to-end.md](docs/end-to-end.md)
Prompt iteration log (PLOG-001 → PLOG-008): [docs/prompt-changelog.md](docs/prompt-changelog.md)
Evidence file for the AI scoring agent: [JUDGES.md](JUDGES.md)
Active task list: [docs/work-queue.md](docs/work-queue.md)

## Hard rules (no exceptions)

1. **Build, don't buy.** No commercial measurement APIs (EagleView, Geospan, Hover, Roofr Instant Estimator). Computation must be visible in the repo. Submitted numbers that match commercial measurement reports without independent computation = disqualified.
2. **Don't fabricate measurements.** Numbers can be cross-checked against ground truth. Fabrication = disqualified.
3. **Public repo, JN owns IP.** Slide 8 of the bounty deck: JobNimbus owns the IP of submitted work. Treat everything you commit as code we're handing them. **No NBD Labs / Crosswing prompts, schemas, or proprietary patterns.** Build clean today.
4. **Submission deadline 1:30 PM Saturday.** Code freeze is technically 2:00 PM but the bounty form closes 30 min earlier. Plan accordingly.

## Coding conventions

- **Languages:** TypeScript or modern JavaScript (`.mjs`). No Python in the main pipeline.
- **Node version:** whatever's on your machine; aim for ≥20.
- **Module style:** ES modules (`import`/`export`), not CommonJS.
- **Async:** `async/await`. No raw promise chains.
- **Errors:** propagate, don't swallow. The CLI should fail loudly if a step breaks.
- **Logs:** structured-ish (`console.log` with object args is fine). Prefix each pipeline step (`[geocode] ...`, `[aerial] ...`).
- **Caching:** all external calls cache to `intermediate/<slug>/`. Re-runs should be free unless `--no-cache` is passed.

## Repo layout

```
.
├── README.md              ← public submission landing page
├── CLAUDE.md              ← you are here
├── benchmarks/            ← example + test properties (ground truth)
├── outputs/               ← per-property results (committed)
│   └── <slug>/
│       ├── aerial.jpg
│       ├── measurement.json
│       └── estimate.pdf
├── intermediate/          ← cache of API + vision calls (gitignored)
│   └── <slug>/
│       ├── geocode.json
│       ├── aerial.jpg
│       ├── vision-pitch.json
│       └── vision-area.json
├── data/                  ← static catalogs (materials.json, etc.)
├── docs/                  ← architecture, work-queue
├── scripts/               ← CLI runners (estimate.mjs, fetch-aerial.mjs)
├── src/                   ← Next.js app (Ethan's track)
└── .env.local             ← API keys (gitignored)
```

## Environment variables

Add to `.env.local` (gitignored):

```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_MAPS_API_KEY=AIza...   # required: Geocoding + Maps Static + Solar API
```

Don't commit `.env.local`. Don't commit API keys ever.

### Shared keys for the team

- **Anthropic key:** one shared team key with a hard spending cap. **Get it from Dan** (sent via the team chat — never via this repo, email, or any public channel). Paste into your own `.env.local`. The key is rotated/revoked after Saturday submission.
- **Google Maps key:** required. Must have **Geocoding API**, **Maps Static API**, and **Solar API** enabled. The Solar API is what disambiguates which house in dense neighborhoods is the subject — without it the pipeline falls back to vision-only and accuracy drops from 4/5 to 2/5 in tolerance. Free fallback (`npm run fetch-aerial-free`) exists but skips the Solar fence.

### What to do if you accidentally commit a key

Tell Dan immediately. The shared Anthropic key gets rotated, the leaked one revoked. Don't try to "fix it with a force push" — git history persists in clones, and Anthropic's key scanner will revoke a public-repo key on its own anyway.

## Address slug convention

Address strings get slugified for filesystem use. Lowercase, alphanumeric, hyphen-separated, no commas:

- `21106 Kenswick Meadows Ct, Humble, TX 77338` → `21106-kenswick-meadows-ct-humble-tx-77338`
- `3561 E 102nd Ct, Thornton, CO 80229` → `3561-e-102nd-ct-thornton-co-80229`

Helper at `scripts/lib/slug.mjs`.

## How to run

```bash
# install deps
npm install

# fetch aerial for one address
node scripts/fetch-aerial.mjs "21106 Kenswick Meadows Ct, Humble, TX 77338"

# full pipeline (after task #8 lands)
npm run estimate -- "address here"

# calibrate against examples (after task #9 lands)
npm run calibrate
```

## When in doubt

- Check [docs/architecture.md](docs/architecture.md) for the pipeline shape and prompt sketches
- Check [docs/work-queue.md](docs/work-queue.md) for what's claimed and what's still open
- Update the work-queue table when you claim or finish a task
- Push early, push often — "scaffold up, no logic yet" merges unblock the team
