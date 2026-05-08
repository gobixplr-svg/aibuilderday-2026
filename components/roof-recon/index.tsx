"use client"
import { useState, useCallback, useEffect } from "react"
import { getTheme, type ThemeMode } from "./theme"
import { HeaderChrome } from "./HeaderChrome"
import { IdleScreen } from "./IdleScreen"
import { ProcessingScreen } from "./ProcessingScreen"
import { ResultsScreen } from "./ResultsScreen"

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

type AppState =
  | { phase: "idle" }
  | { phase: "processing"; address: string }
  | { phase: "result"; data: ResultData }
  | { phase: "error"; address: string; message: string }

type Props = {
  defaultTheme?: ThemeMode
  accent?: string
  onMeasure?: (address: string) => Promise<ResultData>
}

async function defaultMeasure(address: string): Promise<ResultData> {
  const res = await fetch("/api/measure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function RoofRecon({ defaultTheme = "dark", accent = "#FF6B2B", onMeasure }: Props) {
  const [mode, setMode] = useState<ThemeMode>(defaultTheme)
  const [state, setState] = useState<AppState>({ phase: "idle" })

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
    setState({ phase: "processing", address })
    try {
      const measure = onMeasure ?? defaultMeasure
      const data = await measure(address)
      setState({ phase: "result", data: { ...data, address } })
    } catch (err) {
      const address = state.phase === "processing" ? state.address : ""
      setState({ phase: "error", address, message: String(err) })
    }
  }, [onMeasure, state])

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
      <HeaderChrome t={t} themeMode={mode} onThemeChange={handleThemeChange} />

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
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10">
          <p className="font-mono text-sm" style={{ color: "#EF4444" }}>
            Pipeline error: {state.message}
          </p>
          <button
            onClick={handleReset}
            className="font-mono text-[11px] tracking-[0.15em] px-5 py-2 border transition-colors hover:opacity-100"
            style={{ borderColor: t.border, color: t.textSoft }}
          >
            ← TRY AGAIN
          </button>
        </div>
      )}
    </div>
  )
}
