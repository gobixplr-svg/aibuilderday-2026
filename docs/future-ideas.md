# Future Ideas (Nice-to-Haves)

Use this file to track stretch work that is not on the critical path.

## Product / UX

- Add interactive roof overlay preview in the UI (show detected ridges/valleys/eaves on aerial image).
- Add confidence badges per estimate section (pitch, area, line items, pricing confidence).
- Add "customer-ready" estimate variants (concise one-page vs detailed line-item report).
- Add quick "what changed" diff when re-running estimate for the same property.

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

## Demo / Submission Polish

- Add branded PDF theme options and stronger visual hierarchy.
- Add short GIF/video capture script for README/demo assets.
- Add one-click "submission package" export (outputs + summary + key numbers).

## Operational

- Add lightweight telemetry logs for each pipeline stage duration.
- Add retry/backoff wrappers for external API calls.
- Add explicit rate-limit guardrails for bulk runs.
