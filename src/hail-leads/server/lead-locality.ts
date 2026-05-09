/**
 * Best-effort locality for contractor search + UI "city" column from NWS alert text.
 */

export type ResolvedLocality = {
  /** Short label for tables (city, county fragment, or area). */
  displayCity: string
  /** String passed to Nominatim to anchor the map search, usually "Place, ST". */
  nominatimAnchor: string
}

export function resolveLocalityForLeads(
  areaDescription: string,
  alertBlob: string,
  state: string
): ResolvedLocality {
  const st = state.trim().toUpperCase()
  const blob = `${areaDescription}\n${alertBlob}`

  const citiesOf = blob.match(/including the cities of\s+([^.;\n]+)/i)
  if (citiesOf) {
    const chunk = citiesOf[1]
    const first = chunk
      .split(/,|\band\b/i)
      .map((s) => s.trim())
      .find((s) => s.length > 1 && !/^the$/i.test(s))
    if (first) {
      const cleaned = first.replace(/\s+/g, " ")
      return {
        displayCity: cleaned,
        nominatimAnchor: `${cleaned}, ${st}`,
      }
    }
  }

  const locationsOf = blob.match(/the following locations? will experience[^:]*:\s*([^.;\n]+)/i)
  if (locationsOf) {
    const first = locationsOf[1].split(/[,;]/)[0]?.trim()
    if (first) {
      return { displayCity: first, nominatimAnchor: `${first}, ${st}` }
    }
  }

  // "City, ST" at start of area description
  const citySt = areaDescription.match(/^([^;]{2,80}?),\s*([A-Z]{2})\b/i)
  if (citySt && citySt[2].toUpperCase() === st) {
    const name = citySt[1].trim()
    return { displayCity: name, nominatimAnchor: `${name}, ${st}` }
  }

  // First segment (often a county or sub-area) + state
  const firstSeg = areaDescription.split(";")[0]?.trim()
  if (firstSeg && firstSeg.length > 0 && firstSeg.length < 120) {
    return {
      displayCity: firstSeg,
      nominatimAnchor: `${firstSeg}, ${st}`,
    }
  }

  const anchor =
    areaDescription.trim().length > 2 ? `${areaDescription.slice(0, 150).trim()}, ${st}` : st
  return {
    displayCity: st,
    nominatimAnchor: anchor,
  }
}
