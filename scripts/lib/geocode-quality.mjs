// Shared rules for "good enough to measure a specific roof."
//
// Google Geocoding often returns status=OK with geometry.location_type
// APPROXIMATE (or GEOMETRIC_CENTER) for nonsense street strings in a real
// city — e.g. "10000 Hello World Blvd, Lehi, UT" → centroid "Lehi, UT, USA".
//
// City-only ("Lehi, UT") and ZIP-only ("84043") typically return
// locality/postal_code result types without a street-level component.

/** Reject pasted novels / abuse; Google URL length is also bounded. */
export const MAX_GEOCODE_INPUT_LENGTH = 500

/** @type {ReadonlySet<string>} */
export const PRECISE_LOCATION_TYPES = new Set(["ROOFTOP", "RANGE_INTERPOLATED"])

/**
 * Result types must include something more specific than locality/postal_code/country alone.
 * See https://developers.google.com/maps/documentation/geocoding/requests-geocoding#Results
 *
 * @param {{ types?: string[] } | null | undefined} result
 * @returns {boolean}
 */
export function isStreetLevelGeocodeResult(result) {
  const types = result?.types
  if (!Array.isArray(types) || types.length === 0) return false
  /** @type {ReadonlySet<string>} */
  const streetish = new Set(["street_address", "premise", "subpremise", "intersection", "route"])
  return types.some((t) => streetish.has(t))
}

/**
 * @param {{ geometry?: { location_type?: string }; types?: string[] } | null | undefined} result
 * @returns {boolean}
 */
export function isPreciseGeocodeResult(result) {
  const t = result?.geometry?.location_type
  return Boolean(t && PRECISE_LOCATION_TYPES.has(t))
}

/**
 * @param {{ geometry?: { location_type?: string }; types?: string[] } | null | undefined} result
 * @returns {boolean}
 */
export function isAcceptablePropertyGeocodeResult(result) {
  return isPreciseGeocodeResult(result) && isStreetLevelGeocodeResult(result)
}

/**
 * @param {string} address
 * @returns {void}
 */
export function assertGeocodeInputLength(address) {
  if (address.length > MAX_GEOCODE_INPUT_LENGTH) {
    throw new Error(`[geocode] address exceeds ${MAX_GEOCODE_INPUT_LENGTH} characters`)
  }
}
