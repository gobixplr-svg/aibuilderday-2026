// Annotate the aerial JPEG with a 50ft scale bar and a north arrow before
// sending to Claude. Scale-bar accuracy is everything for footprint sqft —
// the model reads pixels far better than it reasons about meters.

import sharp from "sharp"

export async function annotateAerial({ inputPath, outputPath, feetPerPixel }) {
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

  const overlay = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
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
