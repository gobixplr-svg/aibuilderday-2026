"use client"

import { useState } from "react"
import AddressForm from "@/components/AddressForm"
import PipelineStatus from "@/components/PipelineStatus"
import ResultsPanel from "@/components/ResultsPanel"
import type { EstimateResponse } from "@/types"

type AppState = "idle" | "running" | "done" | "error"

export default function Home() {
  const [state, setState] = useState<AppState>("idle")
  const [result, setResult] = useState<EstimateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(address: string) {
    setState("running")
    setResult(null)
    setError(null)

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const data: EstimateResponse = await res.json()
      setResult(data)
      setState("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setState("error")
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {state === "idle" && (
        <>
          <h1 className="text-5xl font-black tracking-tight mb-2" style={{ color: "var(--jn-navy)" }}>
            Aerial Roof Estimator
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--jn-muted)" }}>
            Enter a property address to get a measurement and quote-ready estimate in seconds.
          </p>
          <AddressForm onSubmit={handleSubmit} />
        </>
      )}

      {state === "running" && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--jn-navy)" }}>
            Analyzing property…
          </h2>
          <PipelineStatus />
        </div>
      )}

      {state === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 mt-4">
          <p className="font-semibold text-red-700 mb-1">Pipeline failed</p>
          <p className="text-red-600 text-sm font-mono">{error}</p>
          <button
            onClick={() => setState("idle")}
            className="mt-4 text-sm underline"
            style={{ color: "var(--jn-blue)" }}
          >
            Try again
          </button>
        </div>
      )}

      {state === "done" && result && (
        <>
          <ResultsPanel result={result} />
          <button
            onClick={() => setState("idle")}
            className="mt-6 text-sm underline"
            style={{ color: "var(--jn-blue)" }}
          >
            ← New estimate
          </button>
        </>
      )}
    </div>
  )
}
