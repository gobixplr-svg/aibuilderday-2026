"use client"
import { useState, useCallback, useEffect } from "react"
import { getTheme, type ThemeMode } from "./theme"
import { HeaderChrome } from "./HeaderChrome"
import { IdleScreen } from "./IdleScreen"
import { ProcessingScreen } from "./ProcessingScreen"
import { ResultsScreen } from "./ResultsScreen"
import { DebugPanel } from "./DebugPanel"

export type ConditionFinding = {
  category: "missing_shingles" | "patching_repair" | "moss_or_growth" | "tarp_or_covering" | "structural_sag" | "discoloration_staining" | "debris" | "other"
  description: string
  location_description: string
  severity: "low" | "medium" | "high"
  confidence: number
}

export type ConditionAssessment = {
  overall: "good" | "fair" | "concerning" | "unable_to_assess"
  findings: ConditionFinding[]
  rationale: string
}

type ResultData = {
  address: string
  sqft: number
  footprint_sqft?: number | null
  footprint_confidence?: number | null
  pitch: string
  pitch_confidence: number
  tiers: { name: string; total: number; per_sqft?: number }[]
  condition?: ConditionAssessment | null
  stub?: boolean
}

type AppState =
  | { phase: "idle" }
  | { phase: "processing"; address: string }
  | { phase: "result"; data: ResultData }
  | { phase: "error"; address: string; message: string; kind: "no-roof" | "invalid-address" | "service" | "pipeline" }

type Props = {
  defaultTheme?: ThemeMode
  accent?: string
  onMeasure?: (address: string) => Promise<ResultData>
}

const GEOCODE_SERVICE_CODES = new Set([
  "GEOCODE_UNAVAILABLE",
  "GEOCODE_QUOTA",
  "GEOCODE_DENIED",
  "GEOCODE_NETWORK",
  "GEOCODE_ERROR",
])

class MeasureError extends Error {
  kind: "no-roof" | "invalid-address" | "service" | "pipeline"
  constructor(message: string, kind: "no-roof" | "invalid-address" | "service" | "pipeline") {
    super(message)
    this.kind = kind
  }
}

async function defaultMeasure(address: string): Promise<ResultData> {
  const res = await fetch("/api/measure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    const code = body?.code as string | undefined
    let kind: MeasureError["kind"]
    if (code === "NO_ROOF_DETECTED") kind = "no-roof"
    else if (code === "INVALID_ADDRESS") kind = "invalid-address"
    else if (code && GEOCODE_SERVICE_CODES.has(code)) kind = "service"
    else kind = "pipeline"

    const message =
      kind === "invalid-address"
        ? "Incorrect address. Please try again."
        : typeof body?.error === "string"
          ? body.error
          : "Pipeline failed"
    throw new MeasureError(message, kind)
  }
  return res.json()
}

export function RoofRecon({ defaultTheme = "dark", accent = "#FF6B2B", onMeasure }: Props) {
  const [mode, setMode] = useState<ThemeMode>(defaultTheme)
  const [state, setState] = useState<AppState>({ phase: "idle" })
  const [debugOpen, setDebugOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rr-theme") as ThemeMode | null
      if (saved === "light" || saved === "dark") setMode(saved)
    } catch {}
  }, [])

  const handleThemeChange = useCallback((next: ThemeMode) => {
    setMode(next)
    try { localStorage.setItem("rr-theme", next) } catch {}
  }, [])

  const t = getTheme(mode, accent)

  const handleSubmit = useCallback(async (address: string) => {
    const trimmed = address.trim()
    try {
      const geoRes = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      })
      if (!geoRes.ok) {
        const geoBody = await geoRes.json().catch(() => ({}))
        if (geoBody?.code === "INVALID_ADDRESS") {
          setState({
            phase: "error",
            address: trimmed,
            message: "Incorrect address. Please try again.",
            kind: "invalid-address",
          })
          return
        }
        if (geoBody?.code && GEOCODE_SERVICE_CODES.has(String(geoBody.code))) {
          setState({
            phase: "error",
            address: trimmed,
            message:
              typeof geoBody?.error === "string"
                ? geoBody.error
                : "Geocoding is temporarily unavailable. Please try again.",
            kind: "service",
          })
          return
        }
        setState({
          phase: "error",
          address: trimmed,
          message: typeof geoBody?.error === "string" ? geoBody.error : "Geocoding failed. Please try again.",
          kind: "pipeline",
        })
        return
      }

      setState({ phase: "processing", address: trimmed })
      const measure = onMeasure ?? defaultMeasure
      const data = await measure(trimmed)
      setState({ phase: "result", data: { ...data, address: trimmed } })
    } catch (err) {
      const kind = err instanceof MeasureError ? err.kind : "pipeline"
      const message = err instanceof Error ? err.message : String(err)
      setState({ phase: "error", address: trimmed, message, kind })
    }
  }, [onMeasure])

  const handleReset = useCallback(() => setState({ phase: "idle" }), [])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: t.bg,
        color: t.text,
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
        transition: "background 0.25s ease, color 0.25s ease",
      }}
    >
      <HeaderChrome
        t={t}
        themeMode={mode}
        onThemeChange={handleThemeChange}
        debugOpen={debugOpen}
        onDebugToggle={() => setDebugOpen((o) => !o)}
      />
      {debugOpen && (
        <DebugPanel
          t={t}
          result={state.phase === "result" ? state.data : null}
          phase={state.phase}
          onClose={() => setDebugOpen(false)}
        />
      )}

      {state.phase === "idle" && (
        <IdleScreen t={t} onSubmit={handleSubmit} />
      )}

      {state.phase === "processing" && (
        <ProcessingScreen t={t} address={state.address} onAbort={handleReset} />
      )}

      {state.phase === "result" && (
        <ResultsScreen t={t} result={state.data} onReset={handleReset} />
      )}

      {state.phase === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10 max-w-2xl mx-auto text-center">
          <div
            className="font-mono text-[10px] tracking-[0.3em]"
            style={{
              color:
                state.kind === "no-roof" || state.kind === "invalid-address"
                  ? t.accent
                  : state.kind === "service"
                    ? t.blue
                    : "#EF4444",
            }}
          >
            {state.kind === "no-roof"
              ? "● NO TARGET ACQUIRED"
              : state.kind === "invalid-address"
                ? "● ADDRESS ERROR"
                : state.kind === "service"
                  ? "● GEOCODING UNAVAILABLE"
                  : "● SCAN FAILED"}
          </div>
          <p className="text-xl font-light tracking-tight" style={{ color: t.text }}>
            {state.kind === "invalid-address"
              ? "Incorrect address. Please try again."
              : state.kind === "service"
                ? state.message
                : state.kind === "no-roof"
                  ? "We couldn't find a residential roof at that address."
                  : "The scan hit an error before it could finish."}
          </p>
          {state.kind !== "invalid-address" && state.kind !== "service" && (
            <p className="text-sm leading-relaxed max-w-md" style={{ color: t.textMuted }}>
              {state.kind === "no-roof"
                ? "The address may have geocoded to a commercial street, parking lot, or empty parcel. Try a more specific address — include the unit number, or double-check the street name."
                : state.message}
            </p>
          )}
          <button
            onClick={handleReset}
            className="mt-2 font-mono text-[11px] tracking-[0.15em] px-5 py-2 border transition-colors hover:opacity-100"
            style={{ borderColor: t.border, color: t.textSoft }}
          >
            ← TRY ANOTHER ADDRESS
          </button>
        </div>
      )}
    </div>
  )
}
