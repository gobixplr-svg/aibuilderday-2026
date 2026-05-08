# Materials Pricing Sources

Prices in `materials.json` are national contractor-level estimates, not retail. All figures are approximate and intended for demo/estimate purposes.

## Shingle material cost (per square = 100 sqft)

| Tier | $/square | Basis |
|---|---|---|
| 3-Tab (standard) | $110 | ~$35–40/bundle × 3 bundles/sq, rounded to contractor buy rate |
| Architectural (premium) | $145 | ~$45–55/bundle × 3 bundles/sq; GAF Timberline HDZ street pricing |
| Designer/IR (luxury) | $220 | ~$70–80/bundle × 3 bundles/sq; Class 4 IR premium products |

Reference: Home Depot / Lowes online pricing (2024–2025), rounded to contractor volume rates (typically 10–15% below retail).

## Labor

- **$75/hr** — national median for experienced roofing crew member (BLS 2024: $23/hr journeyman; loaded crew rate ~$65–85/hr all-in including overhead). Mid-range used.

## Accessories

| Item | Rate | Basis |
|---|---|---|
| Underlayment | $25/square | Synthetic felt (e.g. GAF FeltBuster); ~$80–90/roll covers ~3.5 sq |
| Drip edge | $2.50/lf | Aluminum or galvanized; ~$10–12 per 10-ft stick |
| Ridge cap | $5.00/lf | Pre-cut ridge cap; ~$50–60/bundle covers ~35 lf |
| Ice & water shield | $65/square | Eave and valley protection; required in cold climates (CO, MO, IL, VA) |

## Notes

- These are placeholder prices suitable for estimate generation. A production system should pull live pricing from a distributor API (ABC Supply, Beacon Roofing) or allow the contractor to override per job.
- Regional labor variance: Gulf Coast (TX) typically 5–10% below national average; Northeast/Midwest can run 10–15% above. Not modeled here — single national rate used.
