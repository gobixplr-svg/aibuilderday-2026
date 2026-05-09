# Roof Recon: Approach Summary

> JobNimbus AI Builder Day 2026 bounty submission. Repo: https://github.com/gobixplr-svg/aibuilderday-2026

Roof Recon takes an address and produces a roof measurement and 3-tier priced estimate PDF in ~3 minutes. Cost: ~$0.20 per measurement vs $15–$87 for incumbent reports, a wedge that matters when "first-to-respond wins 78% of leads" decides home-services bids.

Pipeline: Google Geocode → Static Maps zoom 20 → Solar API `buildingInsights` (subject polygon, per-segment pitch + area) → annotate aerial with orange SUBJECT box → Claude Sonnet 4.6 vision computes footprint + line items, area-weighted Solar `roofSegmentStats[].pitchDegrees` provides pitch → `roof_area = footprint × pitch_multiplier` → Solar area fence (use Solar's slope-corrected segment-area sum when vision disagrees by >12%) → pure-function estimate engine → branded Puppeteer PDF.

The novel piece is the composition. Naive "address → vision LLM" fails on dense suburbs (model can't tell which of nine houses is the subject) AND a single overhead aerial has almost no parallax for pitch. Solar API delivers numeric subject ID, per-segment pitch, and slope-corrected area as orthogonal signals to vision footprint. **Result: 5/5 examples within ±10% of reference, 1.8% mean error. Pitch: 3/5 exact, 5/5 within ±1 enum step.** Both vision and Solar pitch values persist in `measurement.json` for audit.

Iteration logged in PLOG-001 through PLOG-009 (including reverts).
