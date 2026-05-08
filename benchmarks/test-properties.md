# Test Properties (submission targets)

Five residential pitched roofs. **No reference data given.** Submit total sqft for each via the bounty form by Saturday 1:30 PM.

Source: [jobnimbus/jobnimbus-hackathon-2026/benchmark-measurements.md](https://github.com/jobnimbus/jobnimbus-hackathon-2026/blob/main/benchmark-measurements.md)

---

| # | Address | Predicted sqft | Predicted pitch | Notes |
|---|---|---|---|---|
| 1 | 3561 E 102nd Ct, Thornton, CO 80229 | TBD | TBD | |
| 2 | 1612 S Canton Ave, Springfield, MO 65802 | TBD | TBD | |
| 3 | 6310 Laguna Bay Court, Houston, TX 77041 | TBD | TBD | |
| 4 | 3820 E Rosebrier St, Springfield, MO 65809 | TBD | TBD | |
| 5 | 1261 20th Street, Newport News, VA 23607 | TBD | TBD | |

Update this table as we run our pipeline against each address. Final values get submitted via the form.

## Per-property output artifacts

For each address, write to `outputs/<slug>/`:

- `aerial.jpg` — the aerial image we used
- `measurement.json` — total sqft, pitch, footprint sqft, line items
- `estimate.pdf` — the rendered customer-ready estimate
- `notes.md` — anything weird we noticed (tree cover, complex roof, low-confidence flag)

Example:
```
outputs/3561-e-102nd-ct/
  aerial.jpg
  measurement.json
  estimate.pdf
  notes.md
```

## Cross-check before submission

Before filling out the form:
- Re-run all 5 example properties one final time
- Compare totals to references; flag anything outside ±15%
- Sanity-check test property sqft against parcel-data sqft × reasonable multiplier (should be in the same order of magnitude)
- Ensure all 5 estimate PDFs render without errors
