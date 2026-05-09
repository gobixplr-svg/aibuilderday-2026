# Future Ideas (Nice-to-Haves)

Use this file to track stretch work that is not on the critical path.

## Finding leads
- Find storms in an area to identify homes that an agent could automatically create quotes for that area and send postcards with estimates for root repairs OR for full roof replacement
- Send quotes in the language of the contractor (eg. Spanish)
- Storm detector using NOAA hail data. Automatically recommend to contractors which areas could need a new roof and alert them when an area gets hit.

## Integrations
- JobNimbus playground account integration. Showing up with a working system that already connects to their app would make the submission stand out — quotes/estimates flow directly into JN.

## Product / UX

- Add interactive roof overlay preview in the UI (show detected ridges/valleys/eaves on aerial image).
- Add confidence badges per estimate section (pitch, area, line items, pricing confidence).
- Add "customer-ready" estimate variants (concise one-page vs detailed line-item report).
- Add quick "what changed" diff when re-running estimate for the same property.
- If a house image is not online (user preference to not allow others to see picture) and allow for upload of picture or a more clear image


## Estimation Engine

- Add regional pricing profiles (state/metro presets for labor and material costs).
- Add financing scenarios (cash vs financed monthly payment options).
- Add optional permit/disposal/tax modules as switchable line items.
- Add calibration profile support (global or pitch-banded correction multipliers).

## Measurement Accuracy

- Add multi-image ensemble (same address, multiple zoom/heading captures) and aggregate results.
- Add tree-cover/occlusion detection and automatic low-confidence warnings.
- Add basic geometry sanity checks (ridge/eave ratio constraints, impossible line-item guards).
- Add parcel-footprint cross-check when publicly available parcel data is easy to fetch.

## Pipeline / Automation

- Add batch run report generator (CSV + markdown scoreboard for example/test properties).
- Add automated benchmark regression check in CI (warn when accuracy drifts).
- Add command to regenerate all outputs with one run for demo day.
- Separate the estimator from the measurement calculator so the contractor can re-price/iterate without re-running the slow vision pipeline.

## Demo / Submission Polish

- Add branded PDF theme options and stronger visual hierarchy.
- Add short GIF/video capture script for README/demo assets.
- Add one-click "submission package" export (outputs + summary + key numbers).
- Google Street View on the proposal cover (~20 min of work). PDF cover shows the customer's actual house with the new roof color rendered in. Every other team's PDF will have a stock photo — ours makes the customer cry. Judges will not forget this.

## Operational

- Add lightweight telemetry logs for each pipeline stage duration.
- Add retry/backoff wrappers for external API calls.
- Add explicit rate-limit guardrails for bulk runs.


