"use client"
import type { Theme } from "./theme"

type ResultData = {
  address: string
  sqft: number
  footprint_sqft?: number | null
  footprint_confidence?: number | null
  pitch: string
  pitch_confidence: number
  tiers: { name: string; total: number; per_sqft?: number }[]
  stub?: boolean
}

type Props = {
  t: Theme
  result: ResultData | null
  phase: string
  onClose: () => void
}

function Row({ label, value, real }: { label: string; value: string; real?: boolean }) {
  const dot = real === undefined ? "#888" : real ? "#4ade80" : "#f87171"
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}>
        {real !== undefined && (
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: dot, marginRight: 6, verticalAlign: "middle" }} />
        )}
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: real === false ? "#f87171" : "rgba(255,255,255,0.9)", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,165,0,0.8)", textTransform: "uppercase", marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export function DebugPanel({ t, result, phase, onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        top: 70,
        right: 16,
        width: 300,
        maxHeight: "calc(100vh - 90px)",
        overflowY: "auto",
        background: "rgba(5,12,28,0.96)",
        border: "1px solid rgba(255,165,0,0.3)",
        borderRadius: 8,
        padding: 16,
        zIndex: 9999,
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(255,165,0,0.2)" }}>
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,165,0,0.9)", textTransform: "uppercase" }}>
            ⬡ Debug Panel
          </span>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
            <span style={{ color: "#4ade80" }}>● real</span>
            <span style={{ margin: "0 6px", color: "rgba(255,255,255,0.2)" }}>|</span>
            <span style={{ color: "#f87171" }}>● stub/fake</span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, padding: "2px 6px" }}
        >
          ✕
        </button>
      </div>

      {/* State */}
      <Section title="App State">
        <Row label="phase" value={phase} />
      </Section>

      {result ? (
        <>
          <Section title="Measurement">
            <Row label="address" value={result.address.split(",")[0]} />
            <Row label="roof_area_sqft" value={String(result.sqft)} real={true} />
            <Row label="footprint_sqft" value={result.footprint_sqft != null ? String(result.footprint_sqft) : "—"} real={result.footprint_sqft != null} />
            <Row label="footprint_conf" value={result.footprint_confidence != null ? `${Math.round(result.footprint_confidence * 100)}%` : "—"} real={result.footprint_confidence != null} />
            <Row label="pitch" value={result.pitch || "—"} real={!!result.pitch} />
            <Row label="pitch_confidence" value={`${Math.round(result.pitch_confidence * 100)}%`} real={result.pitch_confidence > 0} />
            <Row label="stub flag" value={result.stub ? "TRUE ⚠️" : "false"} real={!result.stub} />
          </Section>

          <Section title="Tiers">
            {result.tiers.map((tier) => (
              <Row
                key={tier.name}
                label={tier.name}
                value={tier.total > 0 ? `$${tier.total.toLocaleString()} ($${tier.per_sqft?.toFixed(2)}/sqft)` : "—"}
                real={tier.total > 0}
              />
            ))}
          </Section>

          <Section title="Raw JSON">
            <pre
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: "rgba(255,255,255,0.45)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </Section>
        </>
      ) : (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>
          No result data yet.<br />Submit an address to see pipeline output.
        </div>
      )}
    </div>
  )
}
