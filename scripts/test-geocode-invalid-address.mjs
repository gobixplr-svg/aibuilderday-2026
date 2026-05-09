#!/usr/bin/env node
// Negative + smoke tests for geocode acceptance rules.
//
// Usage (requires GOOGLE_MAPS_API_KEY in .env.local):
//   npm run test:geocode

import "./lib/env.mjs"
import { geocode } from "./lib/geocode.mjs"
import { MAX_GEOCODE_INPUT_LENGTH } from "./lib/geocode-quality.mjs"

const REAL_HUMBLE = "21106 Kenswick Meadows Ct, Humble, TX 77338"
const REAL_THORNTON = "3561 E 102nd Ct, Thornton, CO 80229"

/** @type {Array<{ label: string; address: string; expect: "reject" | "ok" }>} */
const CASES = [
  { label: "fake street in real city", address: "10000 Hello World Blvd. Lehi, UT", expect: "reject" },
  { label: "city only", address: "Lehi, UT", expect: "reject" },
  { label: "ZIP only (Lehi area)", address: "84043", expect: "reject" },
  { label: "oversized input", address: "x".repeat(MAX_GEOCODE_INPUT_LENGTH + 1), expect: "reject" },
  { label: "calibration Humble", address: REAL_HUMBLE, expect: "ok" },
  { label: "test Thornton", address: REAL_THORNTON, expect: "ok" },
]

let failed = false

for (const { label, address, expect } of CASES) {
  try {
    const g = await geocode(address)
    if (expect === "reject") {
      console.error(`FAIL [${label}]: expected throw, got`, g.formatted_address)
      failed = true
    } else {
      if (g.location_type !== "ROOFTOP" && g.location_type !== "RANGE_INTERPOLATED") {
        console.error(`FAIL [${label}]: expected ROOFTOP or RANGE_INTERPOLATED, got`, g.location_type)
        failed = true
      } else {
        console.log(`OK [${label}]:`, g.formatted_address.slice(0, 72), `(${g.location_type})`)
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (expect === "ok") {
      console.error(`FAIL [${label}]: expected success, got`, msg)
      failed = true
    } else if (!/\[geocode\]/i.test(msg)) {
      console.error(`FAIL [${label}]: expected [geocode] error, got`, msg)
      failed = true
    } else {
      console.log(`OK [${label}]: rejected —`, msg.split("\n")[0].slice(0, 100))
    }
  }
}

process.exit(failed ? 1 : 0)
