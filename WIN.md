# 🏆 Won — JobNimbus AI Builder Day 2026 Bounty

**Submitted:** Saturday, May 9, 2026, by 1:30 PM MDT
**Result:** Won the Build contest. $10K bounty.
**Team:** Dan Elggren, Will Sandburg, Eric Smith. (Ethan White contributed pre-submission.)

## What we submitted

5 sqft + pitch for the test set, computed by `npm run estimate -- "<address>"`:

| # | Property | Sqft | Pitch | Source |
|---|---|---:|:---:|---|
| 1 | 3561 E 102nd Ct, Thornton CO | **2,081** | 9:12 | Solar-fenced |
| 2 | 1612 S Canton Ave, Springfield MO | **2,432** | 7:12 | Vision |
| 3 | 6310 Laguna Bay Court, Houston TX | **4,186** | 8:12 | Solar-fenced |
| 4 | 3820 E Rosebrier St, Springfield MO | **6,015** | 6:12 | Vision |
| 5 | 1261 20th Street, Newport News VA | **6,702** | 4:12 | Vision |

Calibration on the 5 reference-data example properties: **5/5 within ±10%, 1.78% mean absolute error**, 3/5 pitch exact match (5/5 within ±1 enum step).

## What we built

- **Roof Recon measurement pipeline** — Geocode → Static Maps → Solar API `buildingInsights` (subject polygon + per-segment pitch + slope-corrected area) → Claude Sonnet 4.6 vision (footprint + line items) → roof area = footprint × pitch_multiplier → Solar fence (>12% disagreement → use Solar) → 3-tier estimate engine → branded PDF
- **`/pitch`** — animated marketing page summarizing the technical story
- **`/hail-leads`** — companion lead-gen tool ingesting NWS alerts and surfacing scored contractor leads
- **36-second Remotion-rendered hype reel** (`reference/ReconHypeVideo.mp4`)

The novel piece is the composition: Solar API for subject disambiguation + slope-corrected area as a fence rail, vision LLM for footprint, area-weighted Solar `pitchDegrees` for pitch (PLOG-009).

## Iteration discipline

PLOG-001 through PLOG-009 in [`docs/prompt-changelog.md`](docs/prompt-changelog.md) — every prompt change tracked with measured deltas, including reverts (PLOG-004 over-corrected, PLOG-007 attempted pitch rework that regressed 5/5 → 4/5, both reverted in the same commit).

## Demo artifacts

- **75-90s submission Loom:** https://www.loom.com/share/fb8e727ad4e54ee4b52a4a59bf785242
- **36s Remotion hype reel:** [`reference/ReconHypeVideo.mp4`](reference/ReconHypeVideo.mp4)
- **Approach summary submitted with form:** [`docs/submission-summary.md`](docs/submission-summary.md)
- **Per-property output bundles:** [`outputs/<slug>/`](outputs/) for all 10 properties

## License / IP

Per slide 8 of the bounty deck, JobNimbus owns the IP of submitted work.
