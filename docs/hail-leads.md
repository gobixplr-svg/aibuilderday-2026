# Hail Leads (Isolated Growth Site)

This feature is intentionally isolated from the roof measurement + estimate pipeline.

## Routes

- UI: `/hail-leads`
- Events API: `/api/hail-leads/events`
- Contractor API: `/api/hail-leads/contractors`
- CSV export API: `/api/hail-leads/export` (selected rows)
- PDF export API: `/api/hail-leads/export-pdf` (full top-10 list + NOAA event text)

Contractor results are capped at **10** per storm row (best scores first). The PDF includes the **full NWS `summary` text** as issued, plus a ranked contractor table.

### Events query parameters

Provide **either** `state` (2-letter) **or** `region` (`NE`, `SE`, `SW`, `NW`, `Central`), not both.

- `daysBack` — 1–14 (default 5)
- `city` — optional substring filter on `areaDesc`
- `limit` — max rows (default 30)

Alerts are filtered to **high-impact** criteria: **hail diameter ≥ 1.00″** and/or **peak wind &gt; 60 mph** parsed from NWS text.

Results are **sorted** by **hail size (desc)** → **wind speed (desc)** → **recency (desc)**. The `leadPriorityScore` field is a **1–100 rank** within the returned list (best storm ≈ 100).

## Environment Variables

Add these to `.env.local` if needed:

- `HAIL_API_BASE_URL` (optional, defaults to `https://api.weather.gov`)
- `HAIL_API_KEY` (optional, only used when your alert provider requires auth)
- `HAIL_USER_AGENT` (optional; include a real contact URL per [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/))
- `HAIL_YELP_API_KEY` (optional — [Yelp Fusion](https://docs.developer.yelp.com/docs/fusion-intro); **does not include business email**)
- `HAIL_OVERPASS_URL` (optional, defaults to `https://overpass-api.de/api/interpreter`)
- `HAIL_CUSTOMER_SOURCE_JSON` (optional JSON array for existing customer seed leads)
- `HAIL_PROSPECT_SOURCE_JSON` (optional JSON array for seed prospect fallback leads)

**Contractor sources (merged):** Yelp Fusion (if key set), OpenStreetMap **Overpass** (`craft=roofer`, `shop=roof`), **Nominatim** (parallel text + bounded searches), plus optional JSON seeds. **Email** appears when present in OSM tags (`email`, `contact:email`) or in your seed JSON — most listing APIs omit it.

Example `HAIL_CUSTOMER_SOURCE_JSON` value:

```json
[
  {
    "id": "cust-1",
    "name": "Summit Roofing",
    "leadType": "existing_customer",
    "city": "Houston",
    "state": "TX",
    "phone": "555-555-1212",
    "email": "estimates@summitroofing.example",
    "website": "https://summitroofing.example",
    "source": "jobnimbus_customer_seed"
  }
]
```

## Local Flow

1. Start app: `npm run dev`
2. Open `http://localhost:3000/hail-leads`
3. Search by state (+ optional city + date window)
4. Select an event and generate scored contractor leads
5. Export selected leads to CSV

## Contractor search (per storm row)

When you click **Leads**, prospects are resolved with **OpenStreetMap Nominatim**:

1. Derive a **city / locality** from the NWS `areaDesc` + alert text (`resolveLocalityForLeads`).
2. **Geocode** that locality (`anchor`, e.g. `Humble, TX`).
3. Prefer a **bounded search** for `roofing contractor` inside the geocode bounding box (up to 50 results).
4. If that returns nothing, fall back to a text search: `roofing contractor <anchor>`.

Existing customers still come from `HAIL_CUSTOMER_SOURCE_JSON`; optional prospect seeds from `HAIL_PROSPECT_SOURCE_JSON`.

## Contractor Sourcing Hardening

`src/hail-leads/server/contractor-sources.ts` now includes:
- multi-source adapter pipeline (existing customers + live prospects + seed fallback)
- per-source timeout protection
- source-level telemetry logs (`[hail-leads][source-*]`)
- normalized lead cleaning (phone/website/state)
- junk filtering and stronger dedupe (phone/domain/name+address)
- 30 minute in-memory cache per hail event

## Smoke Test

Run:

`node scripts/hail-leads-smoke.mjs`

This checks:
- existing root route (`/`) still responds
- new isolated hail route (`/hail-leads`) responds
- hail API route (`/api/hail-leads/events`) responds
