#!/usr/bin/env node
// Unit tests for geocode-quality rules (no Google API calls).

import assert from "node:assert/strict"
import {
  assertGeocodeInputLength,
  isAcceptablePropertyGeocodeResult,
  isPreciseGeocodeResult,
  isStreetLevelGeocodeResult,
  MAX_GEOCODE_INPUT_LENGTH,
} from "./lib/geocode-quality.mjs"

function ok(cond, msg) {
  assert.ok(cond, msg)
}

// --- isStreetLevelGeocodeResult ---
ok(!isStreetLevelGeocodeResult(null), "null not street-level")
ok(!isStreetLevelGeocodeResult({ types: [] }), "empty types")
ok(!isStreetLevelGeocodeResult({ types: ["locality", "political"] }), "city centroid types")
ok(!isStreetLevelGeocodeResult({ types: ["postal_code"] }), "ZIP-only types")
ok(isStreetLevelGeocodeResult({ types: ["street_address"] }), "street_address counts")
ok(isStreetLevelGeocodeResult({ types: ["premise"] }), "premise counts")
ok(isStreetLevelGeocodeResult({ types: ["route", "locality"] }), "route counts")
ok(isStreetLevelGeocodeResult({ types: ["intersection"] }), "intersection counts")

// --- isPreciseGeocodeResult ---
ok(isPreciseGeocodeResult({ geometry: { location_type: "ROOFTOP" } }), "ROOFTOP precise")
ok(isPreciseGeocodeResult({ geometry: { location_type: "RANGE_INTERPOLATED" } }), "RANGE_INTERPOLATED precise")
ok(!isPreciseGeocodeResult({ geometry: { location_type: "APPROXIMATE" } }), "APPROXIMATE not precise")
ok(!isPreciseGeocodeResult({ geometry: { location_type: "GEOMETRIC_CENTER" } }), "GEOMETRIC_CENTER not precise")

// --- isAcceptablePropertyGeocodeResult ---
ok(
  isAcceptablePropertyGeocodeResult({
    types: ["street_address"],
    geometry: { location_type: "ROOFTOP" },
  }),
  "full residential hit",
)
ok(
  !isAcceptablePropertyGeocodeResult({
    types: ["locality", "political"],
    geometry: { location_type: "ROOFTOP" },
  }),
  "precise but not street-level (impossible combo in practice but logic)",
)
ok(
  !isAcceptablePropertyGeocodeResult({
    types: ["street_address"],
    geometry: { location_type: "APPROXIMATE" },
  }),
  "street types but imprecise geometry",
)
ok(
  !isAcceptablePropertyGeocodeResult({
    types: ["locality", "political"],
    geometry: { location_type: "APPROXIMATE" },
  }),
  "city-only style result",
)

// --- assertGeocodeInputLength ---
assert.throws(() => assertGeocodeInputLength("x".repeat(MAX_GEOCODE_INPUT_LENGTH + 1)), /exceeds/)
assert.doesNotThrow(() => assertGeocodeInputLength("x".repeat(MAX_GEOCODE_INPUT_LENGTH)))
assert.doesNotThrow(() => assertGeocodeInputLength(""))

console.log("OK: geocode-quality unit tests passed")
