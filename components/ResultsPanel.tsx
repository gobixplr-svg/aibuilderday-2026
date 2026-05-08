import type { EstimateResponse } from "@/types"

export default function ResultsPanel({ result }: { result: EstimateResponse }) {
  const { measurement, estimate } = result

  return (
    <div className="flex flex-col gap-6">
      {/* Stub warning */}
      {estimate.stub && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ Stub data — pitch and footprint are synthetic until vision prompts land (tasks #2 &amp; #3)
        </div>
      )}

      {/* Measurement card */}
      <div
        className="rounded-xl border p-8 text-center"
        style={{ borderColor: "var(--jn-border)", background: "white" }}
      >
        <h2 className="text-sm font-semibold mb-6 text-left" style={{ color: "var(--jn-muted)" }}>
          Roof Measurements
        </h2>

        {/* Hero sqft */}
        <div
          className="text-8xl font-black leading-none"
          style={{ color: "var(--jn-blue)" }}
        >
          {measurement.roof_area_sqft.toLocaleString()}
        </div>
        <div
          className="text-xs font-semibold tracking-widest uppercase mt-2 mb-6"
          style={{ color: "var(--jn-muted)" }}
        >
          sq ft
        </div>

        {/* Secondary stats */}
        <div className="flex justify-center gap-3">
          <span
            className="rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: "var(--jn-border)", color: "var(--jn-text)" }}
          >
            Pitch {measurement.pitch}
          </span>
          <span
            className="rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: "var(--jn-border)", color: "var(--jn-text)" }}
          >
            {Math.round(measurement.pitch_confidence * 100)}% confidence
          </span>
        </div>

        <p className="text-xs mt-6 pt-4 border-t" style={{ borderColor: "var(--jn-border)", color: "var(--jn-muted)" }}>
          {measurement.formatted_address}
        </p>
      </div>

      {/* Estimate tiers */}
      <div>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--jn-navy)" }}>
          Estimate
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {estimate.tiers.map((tier, i) => (
            <div
              key={tier.tier_id}
              className="rounded-xl border p-5"
              style={{
                borderColor: i === 1 ? "var(--jn-blue)" : "var(--jn-border)",
                background: "white",
                boxShadow: i === 1 ? "0 0 0 2px var(--jn-blue)" : undefined,
              }}
            >
              {i === 1 && (
                <div
                  className="text-xs font-semibold rounded-full px-2 py-0.5 inline-block mb-2"
                  style={{ background: "var(--jn-blue)", color: "white" }}
                >
                  Most popular
                </div>
              )}
              <div className="font-semibold text-sm mb-1" style={{ color: "var(--jn-navy)" }}>
                {tier.tier_name}
              </div>
              <div className="text-2xl font-bold mb-3" style={{ color: "var(--jn-navy)" }}>
                ${tier.subtotal.toLocaleString()}
              </div>
              <div className="flex flex-col gap-1">
                {tier.lines.map((line) => (
                  <div key={line.label} className="flex justify-between text-xs gap-2">
                    <span style={{ color: "var(--jn-muted)" }} className="truncate">
                      {line.label}
                    </span>
                    <span className="font-medium shrink-0" style={{ color: "var(--jn-text)" }}>
                      ${line.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PDF download */}
      {result.pdfPath && (
        <a
          href={`/api/pdf?slug=${result.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-xl px-6 py-3 text-center font-semibold text-white"
          style={{ background: "var(--jn-orange)" }}
        >
          Download PDF Estimate
        </a>
      )}
    </div>
  )
}
