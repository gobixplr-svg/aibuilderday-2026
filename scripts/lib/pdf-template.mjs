// PDF template — pure function. estimate object → HTML string.
// Designed for US Letter, single-page primary, ~720pt content width.
// All styles inline so Puppeteer needs no asset loading.
//
// Brand: mocked contractor "Apex Roofing & Exteriors" with a small
// "Powered by JobNimbus" footer badge.
//
// Layout:
//   [Brand header + estimate meta]
//   [Customer block | Property block (with aerial thumbnail)]
//   [Featured tier — Premium — full line-item breakdown]
//   [Tier comparison table — all 3 side-by-side totals]
//   [Terms + signature line]
//   [Footer with "Powered by JobNimbus" badge]

const FEATURED_TIER_ID = "premium"

function fmtCurrency(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtDate(iso) {
  const d = iso ? new Date(iso) : new Date()
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function aerialDataUri(buf) {
  if (!buf) return ""
  return `data:image/jpeg;base64,${buf.toString("base64")}`
}

// Generate a synthetic estimate number from address slug + date
function estimateNumber(slug) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const hash = (slug || "").split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0)
  return `APX-${today}-${hash.toString(16).toUpperCase().padStart(4, "0")}`
}

export function renderEstimateHtml({ estimate, aerialBuffer, customer = {} }) {
  const m = estimate.measurement
  const featured = estimate.tiers.find((t) => t.tier_id === FEATURED_TIER_ID) || estimate.tiers[0]
  const tiers = estimate.tiers
  const li = m.line_items || {}
  const squares = (m.roof_area_sqft / 100).toFixed(2)
  const aerial = aerialDataUri(aerialBuffer)
  const estNum = estimateNumber(m.slug)
  const today = fmtDate(estimate.generated_at)

  // Sane customer defaults so the template never has gaping holes
  const cust = {
    name: customer.name || "Property Owner",
    email: customer.email || "—",
    phone: customer.phone || "—",
    prepared_by: customer.prepared_by || "Apex Estimator",
    ...customer,
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Estimate · ${estNum}</title>
  <style>
    @page { size: Letter; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color: #14213d; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 8.5in; min-height: 11in; padding: 0.55in 0.6in 0.5in; position: relative; }

    /* Brand header */
    .brand-row { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid #14213d; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-mark { width: 44px; height: 44px; border-radius: 8px; background: #14213d; color: #fca311; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 22px; letter-spacing: -1px; }
    .brand-text .name { font-size: 19px; font-weight: 800; letter-spacing: -0.3px; }
    .brand-text .tag { font-size: 10px; color: #6b7280; letter-spacing: 1.6px; text-transform: uppercase; margin-top: 2px; }
    .estimate-meta { text-align: right; }
    .estimate-meta .label { font-size: 9px; letter-spacing: 1.6px; color: #6b7280; text-transform: uppercase; }
    .estimate-meta .num { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; margin-top: 2px; }
    .estimate-meta .date { font-size: 11px; color: #4b5563; margin-top: 4px; }

    /* Headline */
    .headline { margin: 22px 0 18px; }
    .headline h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.8px; }
    .headline .sub { font-size: 12px; color: #6b7280; margin-top: 4px; }

    /* Two-col blocks */
    .blocks { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; }
    .card .h { font-size: 9px; letter-spacing: 1.6px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
    .card .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
    .card .row .k { color: #6b7280; }
    .card .row .v { color: #14213d; font-weight: 600; }

    /* Property card with aerial */
    .property-card { display: flex; gap: 12px; }
    .property-card .info { flex: 1; min-width: 0; }
    .property-card .aerial { width: 130px; height: 130px; flex-shrink: 0; border-radius: 6px; overflow: hidden; background: #e5e7eb; border: 1px solid #d1d5db; }
    .property-card .aerial img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .property-card .info .h { margin-bottom: 6px; }
    .property-card .addr { font-size: 13px; font-weight: 700; line-height: 1.3; margin-bottom: 8px; }

    /* Featured tier */
    .featured { margin-top: 24px; border: 2px solid #14213d; border-radius: 10px; overflow: hidden; }
    .featured-head { background: #14213d; color: #fff; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }
    .featured-head .lhs .label { font-size: 9px; letter-spacing: 1.6px; color: #fca311; text-transform: uppercase; }
    .featured-head .lhs .name { font-size: 18px; font-weight: 700; margin-top: 2px; }
    .featured-head .rhs .total { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
    .featured-head .rhs .label { font-size: 9px; letter-spacing: 1.6px; color: #d1d5db; text-transform: uppercase; text-align: right; }

    .featured-body { padding: 14px 18px 16px; }
    .lines { width: 100%; border-collapse: collapse; }
    .lines th { text-align: left; font-size: 9px; letter-spacing: 1.6px; color: #6b7280; text-transform: uppercase; font-weight: 600; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    .lines th.amount { text-align: right; }
    .lines td { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
    .lines td.amount { text-align: right; font-variant-numeric: tabular-nums; }
    .lines tr:last-child td { border-bottom: none; }
    .totals-row td { padding-top: 12px; font-weight: 700; font-size: 13px; }

    /* Comparison */
    .compare { margin-top: 18px; }
    .compare .h { font-size: 9px; letter-spacing: 1.6px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
    .compare-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .tier-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; position: relative; }
    .tier-card.is-featured { border-color: #14213d; background: #fffaf0; }
    .tier-card .name { font-size: 11px; font-weight: 700; color: #14213d; }
    .tier-card .total { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; margin-top: 4px; }
    .tier-card.is-featured::after { content: "Featured"; position: absolute; top: -8px; right: 10px; background: #fca311; color: #14213d; font-size: 8px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; }
    .tier-card .meta { font-size: 9px; color: #6b7280; margin-top: 4px; }

    /* Measurement summary */
    .measure { margin-top: 18px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
    .measure-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; }
    .measure-item .k { font-size: 8px; letter-spacing: 1.4px; color: #6b7280; text-transform: uppercase; }
    .measure-item .v { font-size: 14px; font-weight: 700; margin-top: 2px; font-variant-numeric: tabular-nums; }

    /* Pre-inspection observations (PLOG-008) */
    .observations { margin-top: 18px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .observations .obs-head { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: baseline; background: #fafbfc; }
    .observations .obs-h { font-size: 9px; letter-spacing: 1.6px; text-transform: uppercase; color: #6b7280; }
    .observations .obs-overall { font-size: 12px; font-weight: 700; color: #14213d; margin-left: 8px; }
    .observations .obs-overall.is-good { color: #16a34a; }
    .observations .obs-overall.is-concerning { color: #fca311; }
    .observations .obs-count { font-size: 9px; letter-spacing: 1.2px; color: #6b7280; text-transform: uppercase; }
    .observations .obs-empty { padding: 12px 14px; font-size: 10px; color: #6b7280; }
    .observations .obs-list { list-style: none; padding: 0; margin: 0; }
    .observations .obs-item { padding: 10px 14px; border-bottom: 1px solid #f3f4f6; }
    .observations .obs-item:last-child { border-bottom: none; }
    .observations .obs-item .obs-row1 { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
    .observations .obs-item .obs-cat { font-size: 11px; font-weight: 700; color: #14213d; }
    .observations .obs-item .obs-cat.is-high { color: #fca311; }
    .observations .obs-item .obs-meta { font-size: 8px; letter-spacing: 1.2px; color: #9ca3af; text-transform: uppercase; white-space: nowrap; }
    .observations .obs-item .obs-desc { font-size: 10px; color: #4b5563; line-height: 1.45; margin-bottom: 2px; }
    .observations .obs-item .obs-loc { font-size: 8px; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase; }
    .observations .obs-foot { padding: 6px 14px; font-size: 8px; letter-spacing: 1.2px; color: #9ca3af; text-transform: uppercase; background: #fafbfc; border-top: 1px solid #f3f4f6; }

    /* Terms */
    .terms { margin-top: 22px; padding: 14px 16px; background: #f9fafb; border-radius: 8px; font-size: 10px; color: #4b5563; line-height: 1.55; }
    .terms strong { color: #14213d; }

    /* Signature */
    .sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 18px; }
    .sig-block .line { border-bottom: 1px solid #14213d; height: 36px; }
    .sig-block .label { font-size: 9px; letter-spacing: 1.4px; text-transform: uppercase; color: #6b7280; margin-top: 4px; }

    /* Footer */
    .footer { margin-top: 22px; padding-top: 14px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #6b7280; }
    .powered { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #14213d; color: #fff; border-radius: 100px; font-size: 9px; letter-spacing: 0.6px; }
    .powered .dot { width: 5px; height: 5px; border-radius: 50%; background: #fca311; }
    .ai-flag { color: #9ca3af; font-style: italic; font-size: 9px; }
  </style>
</head>
<body>
<div class="page">

  <!-- Brand header -->
  <div class="brand-row">
    <div class="brand">
      <div class="brand-mark">A</div>
      <div class="brand-text">
        <div class="name">Apex Roofing &amp; Exteriors</div>
        <div class="tag">Licensed · Insured · Trusted</div>
      </div>
    </div>
    <div class="estimate-meta">
      <div class="label">Estimate</div>
      <div class="num">${estNum}</div>
      <div class="date">${today}</div>
    </div>
  </div>

  <!-- Headline -->
  <div class="headline">
    <h1>Roof Replacement Estimate</h1>
    <div class="sub">Prepared for ${cust.name} · Three options for your home</div>
  </div>

  <!-- Customer + Property cards -->
  <div class="blocks">
    <div class="card">
      <div class="h">Customer</div>
      <div class="row"><span class="k">Name</span><span class="v">${cust.name}</span></div>
      <div class="row"><span class="k">Email</span><span class="v">${cust.email}</span></div>
      <div class="row"><span class="k">Phone</span><span class="v">${cust.phone}</span></div>
      <div class="row"><span class="k">Prepared by</span><span class="v">${cust.prepared_by}</span></div>
    </div>

    <div class="card property-card">
      <div class="info">
        <div class="h">Property</div>
        <div class="addr">${m.formatted_address || m.address}</div>
        <div class="row"><span class="k">Roof area</span><span class="v">${m.roof_area_sqft.toLocaleString()} sqft</span></div>
        <div class="row"><span class="k">Pitch</span><span class="v">${m.pitch}</span></div>
        <div class="row"><span class="k">Squares</span><span class="v">${squares}</span></div>
      </div>
      ${aerial ? `<div class="aerial"><img src="${aerial}" alt="Aerial view" /></div>` : ""}
    </div>
  </div>

  <!-- Measurement detail -->
  <div class="measure">
    <div class="measure-item"><div class="k">Footprint</div><div class="v">${m.footprint_sqft.toLocaleString()}</div></div>
    <div class="measure-item"><div class="k">Ridge</div><div class="v">${(li.ridge ?? 0)} lf</div></div>
    <div class="measure-item"><div class="k">Hip</div><div class="v">${(li.hip ?? 0)} lf</div></div>
    <div class="measure-item"><div class="k">Valley</div><div class="v">${(li.valley ?? 0)} lf</div></div>
    <div class="measure-item"><div class="k">Rake</div><div class="v">${(li.rake ?? 0)} lf</div></div>
    <div class="measure-item"><div class="k">Eave</div><div class="v">${(li.eave ?? 0)} lf</div></div>
  </div>

  <!-- Featured tier -->
  <div class="featured">
    <div class="featured-head">
      <div class="lhs">
        <div class="label">Recommended</div>
        <div class="name">${featured.tier_name}</div>
      </div>
      <div class="rhs">
        <div class="label">Total</div>
        <div class="total">${fmtCurrency(featured.subtotal)}</div>
      </div>
    </div>
    <div class="featured-body">
      <table class="lines">
        <thead>
          <tr>
            <th>Item</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${featured.lines.map((l) => `
          <tr>
            <td>${l.label}</td>
            <td class="amount">${fmtCurrency(l.amount)}</td>
          </tr>`).join("")}
          <tr class="totals-row">
            <td>Total</td>
            <td class="amount">${fmtCurrency(featured.subtotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Tier comparison -->
  <div class="compare">
    <div class="h">Compare options</div>
    <div class="compare-grid">
      ${tiers.map((t) => `
      <div class="tier-card${t.tier_id === FEATURED_TIER_ID ? " is-featured" : ""}">
        <div class="name">${t.tier_name}</div>
        <div class="total">${fmtCurrency(t.subtotal)}</div>
        <div class="meta">${tierMeta(t)}</div>
      </div>`).join("")}
    </div>
  </div>

  ${m.condition ? renderObservationsSection(m.condition) : ""}

  <!-- Terms -->
  <div class="terms">
    <strong>Estimate notes.</strong> Pricing reflects ${m.roof_area_sqft.toLocaleString()} sqft of roof area at ${m.pitch} pitch (${squares} squares). Estimate valid for 30 days from the date issued. Final pricing subject to inspection at framing if any unforeseen conditions are discovered. Permits, dumpster, and disposal included where required by local code. <strong>Warranty:</strong> tier-dependent (see manufacturer documentation). <strong>Payment:</strong> 30% on contract signing, 60% at material delivery, 10% at completion.
  </div>

  <!-- Signature -->
  <div class="sig-row">
    <div class="sig-block">
      <div class="line"></div>
      <div class="label">Customer Signature · Date</div>
    </div>
    <div class="sig-block">
      <div class="line"></div>
      <div class="label">Apex Authorized · Date</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      Apex Roofing &amp; Exteriors · (xxx) xxx-xxxx · estimates@apexroofing.example
      ${(m.pitch_stub || m.footprint_stub) ? `<div class="ai-flag">⚠ stub data — measurement awaiting prompts #2/#3</div>` : ""}
    </div>
    <div class="powered"><span class="dot"></span>Powered by JobNimbus</div>
  </div>

</div>
</body>
</html>`
}

function tierMeta(tier) {
  // Cheap heuristic for one-line meta when the catalog hasn't supplied one
  if (tier.tier_id === "standard") return "25-yr · 3-tab asphalt"
  if (tier.tier_id === "premium") return "30-yr · architectural laminate"
  if (tier.tier_id === "luxury") return "Lifetime · designer / impact-resistant"
  return ""
}

const CONDITION_LABEL = {
  good: "Good",
  fair: "Fair",
  concerning: "Concerning",
  unable_to_assess: "Inconclusive",
}

const OBSERVATION_CATEGORY_LABEL = {
  missing_shingles: "Missing material",
  patching_repair: "Visible patching",
  moss_or_growth: "Biological growth",
  tarp_or_covering: "Tarp / covering",
  structural_sag: "Structural sag",
  discoloration_staining: "Discoloration / staining",
  debris: "Debris",
  other: "Other",
}

// Pre-inspection observations section (PLOG-008). Frames as observations
// the contractor should look at on the in-person visit, NOT as a damage
// diagnosis. Section omitted entirely when there's no condition data.
function renderObservationsSection(condition) {
  const label = CONDITION_LABEL[condition.overall] || condition.overall
  const overallClass = condition.overall === "good"
    ? "is-good"
    : condition.overall === "concerning"
      ? "is-concerning"
      : ""
  const findings = Array.isArray(condition.findings) ? condition.findings : []
  const countLabel = `${findings.length} ${findings.length === 1 ? "observation" : "observations"}`

  return `
  <div class="observations">
    <div class="obs-head">
      <div>
        <span class="obs-h">Pre-inspection observations</span>
        <span class="obs-overall ${overallClass}">${label}</span>
      </div>
      <span class="obs-count">${countLabel}</span>
    </div>
    ${findings.length === 0 ? `
      <div class="obs-empty">No notable issues visible from satellite imagery. An in-person inspection will confirm.</div>
    ` : `
      <ul class="obs-list">
        ${findings.map((f) => `
          <li class="obs-item">
            <div class="obs-row1">
              <span class="obs-cat ${f.severity === "high" ? "is-high" : ""}">${OBSERVATION_CATEGORY_LABEL[f.category] || f.category}</span>
              <span class="obs-meta">${(f.severity || "").toUpperCase()} · ${Math.round((f.confidence || 0) * 100)}%</span>
            </div>
            <div class="obs-desc">${escapeHtml(f.description || "")}</div>
            <div class="obs-loc">${escapeHtml(f.location_description || "")}</div>
          </li>
        `).join("")}
      </ul>
    `}
    <div class="obs-foot">AI vision condition assessment · pre-inspection only · not a diagnosis</div>
  </div>`
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
