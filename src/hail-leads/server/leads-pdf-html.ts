import type { HailEvent, ScoredContractorLead } from "@/src/hail-leads/types"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function nlToBr(s: string): string {
  return escapeHtml(s).replace(/\r\n/g, "\n").replace(/\n/g, "<br/>")
}

function fmtHail(n: number | undefined): string {
  if (n === undefined) return "—"
  return `${n.toFixed(2)}"`
}

function fmtWind(n: number | undefined): string {
  if (n === undefined) return "—"
  return `${Math.round(n)} mph`
}

export function renderLeadsPdfHtml(event: HailEvent, leads: ScoredContractorLead[]): string {
  const generated = new Date().toISOString()
  const rows = leads
    .map(
      (lead, i) => `
    <tr>
      <td style="padding:8px;border:1px solid #ccc;">${i + 1}</td>
      <td style="padding:8px;border:1px solid #ccc;">${escapeHtml(lead.name)}</td>
      <td style="padding:8px;border:1px solid #ccc;text-align:center;">${lead.score}</td>
      <td style="padding:8px;border:1px solid #ccc;">${escapeHtml(lead.contactability)}</td>
      <td style="padding:8px;border:1px solid #ccc;">${escapeHtml(lead.city ?? "—")}</td>
      <td style="padding:8px;border:1px solid #ccc;">${escapeHtml(lead.state ?? "—")}</td>
      <td style="padding:8px;border:1px solid #ccc;font-size:9px;">${escapeHtml(lead.phone ?? "—")}</td>
      <td style="padding:8px;border:1px solid #ccc;font-size:9px;word-break:break-all;">${escapeHtml(lead.email ?? "—")}</td>
      <td style="padding:8px;border:1px solid #ccc;font-size:9px;word-break:break-all;">${escapeHtml(lead.website ?? "—")}</td>
      <td style="padding:8px;border:1px solid #ccc;font-size:9px;">${escapeHtml(lead.address ?? "—")}</td>
      <td style="padding:8px;border:1px solid #ccc;font-size:9px;">${escapeHtml(lead.source)}</td>
    </tr>`
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>JobNimbus — Hail leads</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #0D1F3C; margin: 0; padding: 24px; font-size: 11px; }
    h1 { font-size: 20px; margin: 0 0 4px; color: #0D1F3C; }
    .brand { color: #FF6B2B; font-weight: 700; letter-spacing: 0.08em; font-size: 10px; }
    .meta { color: #444; margin-bottom: 16px; font-size: 10px; }
    h2 { font-size: 13px; margin: 20px 0 8px; border-bottom: 2px solid #FF6B2B; padding-bottom: 4px; }
    .noaa { background: #f4f6fb; border: 1px solid #dde4f0; padding: 12px; margin-bottom: 16px; font-size: 10px; line-height: 1.45; }
    .noaa-title { font-weight: 700; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th { background: #0D1F3C; color: #fff; padding: 8px 6px; text-align: left; border: 1px solid #0D1F3C; }
    th.num { text-align: center; width: 28px; }
    .footer { margin-top: 20px; font-size: 9px; color: #666; }
  </style>
</head>
<body>
  <div class="brand">JOBNIMBUS · HAIL LEADS</div>
  <h1>Top contractor prospects</h1>
  <div class="meta">Generated ${escapeHtml(generated)} · ${leads.length} lead(s) · NWS event reference below</div>

  <h2>NOAA / NWS event (description as issued)</h2>
  <div class="noaa">
    <div class="noaa-title">${escapeHtml(event.title)}</div>
    <div><strong>Area:</strong> ${escapeHtml(event.areaDescription)}</div>
    <div><strong>Locality:</strong> ${escapeHtml(event.city ?? "—")}, ${escapeHtml(event.state)}</div>
    <div><strong>Hail / wind:</strong> ${fmtHail(event.hailSizeInches)} · ${fmtWind(event.windGustMph)}</div>
    <div><strong>Effective:</strong> ${escapeHtml(event.startsAt)} — ${escapeHtml(event.endsAt ?? "—")}</div>
    <div style="margin-top:10px;"><strong>Event text:</strong></div>
    <div style="margin-top:4px;">${nlToBr(event.summary)}</div>
  </div>

  <h2>Contractors (ranked)</h2>
  <table>
    <thead>
      <tr>
        <th class="num">#</th>
        <th>Name</th>
        <th class="num">Score</th>
        <th>Contact</th>
        <th>City</th>
        <th>ST</th>
        <th>Phone</th>
        <th>Email</th>
        <th>Website</th>
        <th>Address</th>
        <th>Source</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">Source data: OpenStreetMap Nominatim and optional JobNimbus customer seeds. Storm data: weather.gov alerts.</div>
</body>
</html>`
}
