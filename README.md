# Aerial Roof Measurement & Auto-Estimating

> Submission for the JobNimbus AI Hackathon 2026 ($10K bounty track).
> AI Builder Day, May 8–9 2026, Lehi UT.

## What this tool does

Address in → roof measurement (total sqft + line items where possible) + quote-ready estimate out.

The bounty's example/test properties are residential pitched roofs across multiple states (TX, FL, IL, MO, CO, VA). The tool's job is to compute roof measurements from publicly-available aerial imagery without calling commercial measurement APIs (build, don't buy), then turn those measurements into a contractor-ready estimate with material options.

## Approach (high-level)

1. **Aerial acquisition** — pull a high-resolution overhead image of the property from a public source (e.g. Google Static Maps, Mapbox)
2. **Pitch estimation** — infer the dominant roof pitch from visible cues
3. **Footprint extraction** — segment the roof footprint from the aerial image
4. **Roof area** — `roof_area_sqft = footprint_sqft × pitch_multiplier` (per the bounty's hint)
5. **Line items** — detect and measure ridge / hip / valley / rake / eave linear-feet where possible
6. **Estimate** — multiply measurements by per-square material costs across 3 tiers (3-tab / architectural / premium), produce a quote PDF

> Stack and AI choices documented in `docs/architecture.md`. Per-property outputs in `outputs/`.

## How to run

```bash
# install
npm install

# environment
cp .env.example .env.local
# fill in: ANTHROPIC_API_KEY, GOOGLE_MAPS_API_KEY (or MAPBOX_TOKEN)

# run on a single address
npm run estimate -- "3561 E 102nd Ct, Thornton, CO 80229"

# run on the full bounty test set
npm run estimate:test-set
```

Output: a JSON measurement report and a PDF estimate per address, written to `outputs/`.

## Repo layout

```
.
├── README.md                       ← you are here
├── benchmarks/                     ← example + test properties from JN's repo
│   ├── example-properties.md       ← 5 with reference data (calibration)
│   └── test-properties.md          ← 5 to score on (submission targets)
├── outputs/                        ← per-property results
│   ├── 3561-e-102nd-ct/            ← test property 1
│   │   ├── aerial.jpg
│   │   ├── measurement.json
│   │   └── estimate.pdf
│   └── ...                         ← one folder per property
├── docs/
│   ├── architecture.md             ← stack, pipeline, models
│   └── work-queue.md               ← team task breakdown
├── src/                            ← Next.js app
└── scripts/                        ← CLI runners for measurement + estimate
```

## What's in the estimate

The estimate is delivered as a customer-ready PDF with three roofing material tiers:

| Tier | Material | Per-sq cost | Warranty |
|---|---|---|---|
| Standard | 3-tab asphalt | ~$110/sq | 25 yr |
| Premium | Architectural laminate | ~$145/sq | 30-50 yr |
| Luxury | Designer / impact-resistant | ~$220/sq | Lifetime |

Material catalog (real product names, real-ish prices) is in `data/materials.json`. Sources cited in the catalog.

## Submission targets

Per `benchmarks/test-properties.md`, the five addresses we submit total sqft for:

1. 3561 E 102nd Ct, Thornton, CO 80229
2. 1612 S Canton Ave, Springfield, MO 65802
3. 6310 Laguna Bay Court, Houston, TX 77041
4. 3820 E Rosebrier St, Springfield, MO 65809
5. 1261 20th Street, Newport News, VA 23607

Submitted via the form in `https://github.com/jobnimbus/jobnimbus-hackathon-2026/blob/main/SUBMISSION.md` by Saturday 1:30 PM.

## AI choices

- **Claude Sonnet 4.x** for vision-based footprint and pitch analysis
- **Claude Haiku 4.5** for fast classification (e.g. "is this image showing a roof?")
- Both behind the Anthropic SDK; switchable via env

## Known limitations

- Pitch estimation is heuristic, not photogrammetric. Expect 1-step pitch error on complex roofs.
- Line-item linear-feet extraction is best-effort; total sqft is the priority signal.
- Footprint extraction depends on aerial image quality; obstructed roofs (heavy tree cover) will produce wider tolerance.

## Team

- Dan Elggren · Eric Smith · Will [last] · Ethan [last]
- AI Builder Day 2026, Lehi UT, JobNimbus track

## License

This work is submitted to the JobNimbus AI Hackathon 2026 under the bounty terms (slide 8: JN owns the IP of submitted work).
