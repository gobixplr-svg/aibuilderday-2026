// Annotate the aerial JPEG with a 50ft scale bar, north arrow, and
// (optionally) a target reticle + Solar-API building outline that tells
// Claude exactly which structure to measure.
//
// Subject identification was the actual bug behind PLOG-004's instability —
// on dense suburban images the model has no way to know which house among
// 4-6 visible ones is "the" subject. The reticle + outline fix that.

import sharp from "sharp"
import { latLngToImagePixels } from "./solar-api.mjs"

export async function annotateAerial({
  inputPath,
  outputPath,
  feetPerPixel,
  // Optional subject highlighting. Pass these together for the reticle +
  // outline pass; pass none for the original scale-bar-only annotation.
  centerLat,
  centerLng,
  buildingInsights, // raw response from getBuildingInsights()
}) {
  const meta = await sharp(inputPath).metadata()
  const W = meta.width
  const H = meta.height

  const barFt = 50
  const barPx = Math.round(barFt / feetPerPixel)
  const barX = 24
  const barY = H - 48
  const barH = 8

  const arrowX = W - 40
  const arrowY = 32
  const arrowSize = 22

  // Subject overlay — only drawn when we have Solar API + center coords
  let subjectOverlay = ""
  if (buildingInsights && centerLat != null && centerLng != null) {
    subjectOverlay = renderSubjectOverlay({
      buildingInsights,
      centerLat,
      centerLng,
      metersPerPixel: feetPerPixel * 0.3048,
      imageWidth: W,
      imageHeight: H,
    })
  }

  const overlay = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${subjectOverlay}
      <g font-family="Helvetica, Arial, sans-serif" font-weight="700">
        <rect x="${barX - 6}" y="${barY - 18}" width="${barPx + 12}" height="${barH + 32}"
              fill="rgba(255,255,255,0.85)" stroke="black" stroke-width="1" rx="3"/>
        <rect x="${barX}" y="${barY}" width="${barPx}" height="${barH}" fill="black"/>
        <rect x="${barX}" y="${barY}" width="${barPx / 2}" height="${barH}" fill="white" stroke="black" stroke-width="1"/>
        <rect x="${barX}" y="${barY}" width="${barPx}" height="${barH}" fill="none" stroke="black" stroke-width="1"/>
        <text x="${barX + barPx / 2}" y="${barY - 4}" text-anchor="middle" font-size="14" fill="black">50 ft</text>
      </g>
      <g font-family="Helvetica, Arial, sans-serif" font-weight="700">
        <circle cx="${arrowX}" cy="${arrowY}" r="${arrowSize}"
                fill="rgba(255,255,255,0.85)" stroke="black" stroke-width="1.5"/>
        <polygon points="${arrowX},${arrowY - 14} ${arrowX - 7},${arrowY + 6} ${arrowX + 7},${arrowY + 6}" fill="black"/>
        <text x="${arrowX}" y="${arrowY + 18}" text-anchor="middle" font-size="11" fill="black">N</text>
      </g>
    </svg>
  `

  await sharp(inputPath)
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toFile(outputPath)
}

function renderSubjectOverlay({ buildingInsights, centerLat, centerLng, metersPerPixel, imageWidth, imageHeight }) {
  const insights = buildingInsights
  const subjectCenter = insights?.center
  const bbox = insights?.boundingBox
  if (!subjectCenter || !bbox) return ""

  // Convert subject center + bounding box corners to image pixels
  const c = latLngToImagePixels({
    lat: subjectCenter.latitude,
    lng: subjectCenter.longitude,
    centerLat,
    centerLng,
    metersPerPixel,
    imageWidth,
    imageHeight,
  })

  const sw = latLngToImagePixels({
    lat: bbox.sw.latitude,
    lng: bbox.sw.longitude,
    centerLat,
    centerLng,
    metersPerPixel,
    imageWidth,
    imageHeight,
  })
  const ne = latLngToImagePixels({
    lat: bbox.ne.latitude,
    lng: bbox.ne.longitude,
    centerLat,
    centerLng,
    metersPerPixel,
    imageWidth,
    imageHeight,
  })

  // bbox in image coords. ne is north-east → top-right (lower y). sw → bottom-left.
  const left = Math.min(sw.x, ne.x)
  const right = Math.max(sw.x, ne.x)
  const top = Math.min(sw.y, ne.y)
  const bottom = Math.max(sw.y, ne.y)
  const w = right - left
  const h = bottom - top

  // Reticle at subject center (small target)
  const reticleR = 14
  const tickLen = 8

  return `
    <g>
      <!-- Building bounding box: dashed orange -->
      <rect x="${left}" y="${top}" width="${w}" height="${h}"
            fill="none" stroke="#FF6B2B" stroke-width="3" stroke-dasharray="8 4" />
      <!-- Subject label -->
      <rect x="${left}" y="${top - 22}" width="86" height="20"
            fill="#FF6B2B" />
      <text x="${left + 6}" y="${top - 7}"
            font-family="Helvetica, Arial, sans-serif" font-weight="700"
            font-size="13" fill="white">SUBJECT</text>
      <!-- Center reticle -->
      <circle cx="${c.x}" cy="${c.y}" r="${reticleR}"
              fill="none" stroke="#FF6B2B" stroke-width="2.5" />
      <line x1="${c.x - reticleR - tickLen}" y1="${c.y}" x2="${c.x - reticleR}" y2="${c.y}"
            stroke="#FF6B2B" stroke-width="2.5" />
      <line x1="${c.x + reticleR}" y1="${c.y}" x2="${c.x + reticleR + tickLen}" y2="${c.y}"
            stroke="#FF6B2B" stroke-width="2.5" />
      <line x1="${c.x}" y1="${c.y - reticleR - tickLen}" x2="${c.x}" y2="${c.y - reticleR}"
            stroke="#FF6B2B" stroke-width="2.5" />
      <line x1="${c.x}" y1="${c.y + reticleR}" x2="${c.x}" y2="${c.y + reticleR + tickLen}"
            stroke="#FF6B2B" stroke-width="2.5" />
    </g>
  `
}
