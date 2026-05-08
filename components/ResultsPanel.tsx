import type { EstimateResponse } from "@/types"

export default function ResultsPanel({ result }: { result: EstimateResponse }) {
  const { measurement, estimate } = result

  return (
    <div className="flex flex-col gap-6">
      {/* Measurement summary */}
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "var(--jn-border)", background: "white" }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--jn-navy)" }}>
          Roof Measurements
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold" style={{ color: "var(--jn-blue)" }}>
              {measurement.roof_area_sqft.toLocaleString()}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--jn-muted)" }}>
              Total sq ft
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold" style={{ color: "var(--jn-navy)" }}>
              {measurement.pitch}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--jn-muted)" }}>
              Roof pitch
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold" style={{ color: "var(--jn-navy)" }}>
              {Math.round(measurement.pitch_confidence * 100)}%
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--jn-muted)" }}>
              Confidence
            </div>
          </div>
        </div>
        <p className="text-xs mt-4 pt-4 border-t" style={{ borderColor: "var(--jn-border)", color: "var(--jn-muted)" }}>
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

      {/* PDF download (shown when available) */}
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
