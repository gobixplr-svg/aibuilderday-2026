# Example Properties (calibration)

Five residential pitched roofs with two reference measurements each. **We are NOT scored on these** — they're for calibrating our pipeline.

Source: [jobnimbus/jobnimbus-hackathon-2026/benchmark-measurements.md](https://github.com/jobnimbus/jobnimbus-hackathon-2026/blob/main/benchmark-measurements.md)

The two references (labeled A and B) don't always agree. The bounty's bar is "in range," not exact match. Use the spread between A and B as a signal of the natural variance on each property.

---

## 1. 21106 Kenswick Meadows Ct, Humble, TX 77338

| Source | Total sqft | Pitch |
|---|---|---|
| Reference A | 2,443 | 6:12 |
| Reference B | 2,343 | 6:12 |

**Reference A line items:** Ridge/Hip 141 · Valleys 40 · Rakes 101 · Eaves 187 · Flashing 27 · Step Flashing 21
**Reference B line items:** Ridge 26 · Hip 101 · Valley 38 · Rake 83 · Eave 90 · Gutter 74 · Flashing 25 · Total Eaves 164

---

## 2. 5914 Copper Lilly Lane, Spring, TX 77389

| Source | Total sqft | Pitch |
|---|---|---|
| Reference A | 4,391 | 8:12 |
| Reference B | 4,296 | 8:12 |

**Reference A line items:** Ridge 79 · Hip 321 · Valleys 197 · Rakes 121 · Eaves 324 · Flashing 51 · Step Flashing 94
**Reference B line items:** Ridge 77 · Hip 348 · Valley 195 · Rake 119 · Eave 220 · Gutter 73 · Step Flashing 92 · Total Eaves 293

---

## 3. 122 NW 13th Ave, Cape Coral, FL 33993

| Source | Total sqft | Pitch |
|---|---|---|
| Reference A | 2,917 | 6:12 |
| Reference B | 2,851 | 6:12 |

**Reference A line items:** Ridge 59 · Hip 83 · Valleys 22 · Rakes 51 · Eaves 201 · Flashing 1 · Step Flashing 19
**Reference B line items:** Ridge 59 · Hip 81 · Valley 21 · Rake 49 · Eave 148 · Gutter 50 · Step Flashing 17 · Total Eaves 198

---

## 4. 14132 Trenton Ave, Orland Park, IL 60462

| Source | Total sqft | Pitch |
|---|---|---|
| Reference A | 2,990 | 4:12 |
| Reference B | 2,935 | 4:12 |

**Reference A line items:** Ridge/Hip 241 · Valleys 78 · Rakes 0 · Eaves 255
**Reference B line items:** Ridge 48 · Hip 187 · Valley 78 · Rake 0 · Gutter 251 · Step Flashing 10 · Total Eaves 251

---

## 5. 835 S Cobble Creek, Nixa, MO 65714

| Source | Total sqft | Pitch |
|---|---|---|
| Reference A | 3,070 | 8:12 |
| Reference B | 3,017 | 8:12 |

**Reference A line items:** Ridge/Hip 232 · Valleys 113 · Rakes 50 · Eaves 211
**Reference B line items:** Ridge 79 · Hip 150 · Valley 111 · Rake 48 · Gutter 208 · Step Flashing 4 · Unset 49

---

## Calibration use

For each example property:

1. Run our pipeline end-to-end
2. Record our predicted total sqft and pitch
3. Compare to A and B; compute deviation from average((A+B)/2)
4. If our number is outside the [A, B] envelope, log the delta and inspect

Target: consistent results across all 5 examples within ±10% of the reference average. The submitted test properties get whatever calibration we lock in here.

## Pitch multiplier reference

The bounty hint: `roof_area_sqft = footprint_sqft × pitch_multiplier`

| Pitch | Multiplier |
|---|---|
| 4:12 | 1.054 |
| 5:12 | 1.083 |
| 6:12 | 1.118 |
| 7:12 | 1.158 |
| 8:12 | 1.202 |
| 9:12 | 1.250 |
| 10:12 | 1.302 |
| 12:12 | 1.414 |

If we get pitch right and footprint right, total sqft falls out.
