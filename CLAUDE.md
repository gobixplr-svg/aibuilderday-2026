# CLAUDE.md — AI Builder Day 2026 / JobNimbus Bounty

> Shared house rules for anyone using Claude Code on this repo. Read before contributing.

## What we're building

A measurement-and-estimate pipeline for residential pitched roofs. Address in → roof measurement (total sqft + line items) + quote-ready estimate PDF out. Five test addresses to submit total sqft for, by Saturday May 9 at 1:30 PM.

Brief: [jobnimbus/jobnimbus-hackathon-2026](https://github.com/jobnimbus/jobnimbus-hackathon-2026)
Full architecture: [docs/architecture.md](docs/architecture.md)
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
GOOGLE_MAPS_API_KEY=AIza...
```

Don't commit `.env.local`. Don't commit API keys ever.

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
