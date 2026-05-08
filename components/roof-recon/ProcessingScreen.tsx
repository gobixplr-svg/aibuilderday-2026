"use client"
import { useEffect, useRef, useState } from "react"
import type { Theme } from "./theme"
import { GridBG } from "./GridBG"
import { Reticle } from "./Reticle"
import { SatelliteFrame } from "./SatelliteFrame"

const WITTY_MESSAGES = [
  "Arguing with the satellite dish…",
  "Steering the drone past the neighbor's tree…",
  "Counting shingles, one by one…",
  "Asking the AI to squint harder…",
  "Triangulating against the chimney…",
  "Negotiating with cloud cover…",
  "Unfolding the roof in 3D…",
  "Calibrating the pitch protractor…",
  "Cross-checking with the property line…",
  "Computing slope, hip, and valley…",
]

const PIPELINE = [
  { label: "Locating address",          at: 0  },
  { label: "Fetching satellite tile",   at: 4  },
  { label: "Segmenting roof footprint", at: 12 },
  { label: "Estimating pitch & area",   at: 24 },
  { label: "Generating 3-tier estimate",at: 38 },
]

const TARGET_SECS = 50

type Props = {
  t: Theme
  address: string
  onAbort: () => void
}

export function ProcessingScreen({ t, address, onAbort }: Props) {
  const startRef = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIdx((i) => (i + 1) % WITTY_MESSAGES.length)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  const progress = Math.min(elapsed / TARGET_SECS, 0.98)

  return (
    <div className="relative flex-1 flex flex-col">
      <GridBG t={t} />
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">

        {/* Left: satellite view */}
        <div className="relative p-8 lg:p-12 flex flex-col">
          <div className="text-[10px] font-mono tracking-[0.3em] mb-3" style={{ color: t.textSoft }}>
            LIVE&nbsp;FEED&nbsp;//&nbsp;{address.split(",")[0].toUpperCase()}
          </div>

          <div className="relative flex-1 min-h-[360px] border" style={{ borderColor: t.border }}>
            <SatelliteFrame scanning accent={t.accent} />
            <div className="absolute inset-0 grid place-items-center">
              <Reticle size={260} scanning color={t.accent} />
            </div>
            {/* HUD overlays */}
            <div className="absolute top-3 left-3 font-mono text-[10px] tracking-wider text-white/70 leading-snug">
              <div>ZOOM: 21x</div>
              <div>RES: 0.3m/px</div>
            </div>
            <div className="absolute top-3 right-3 font-mono text-[10px] tracking-wider text-right text-white/70 leading-snug">
              <div>40.01498°N</div>
              <div>-105.27053°W</div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between font-mono text-[10px] tracking-wider text-white/60">
              <div>FRAME&nbsp;0427&nbsp;/&nbsp;0500</div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.accent }} />
                CAPTURING
              </div>
            </div>
          </div>
        </div>

        {/* Right: status */}
        <div
          className="relative px-8 lg:px-12 py-12 flex flex-col justify-center border-l"
          style={{ borderColor: t.border }}
        >
          {/* Elapsed timer */}
          <div className="flex items-baseline gap-4">
            <div
              className="font-mono tabular-nums leading-none"
              style={{ fontSize: "clamp(3.5rem, 8vw, 6rem)", fontWeight: 300, letterSpacing: "-0.04em", color: t.text }}
            >
              {String(Math.floor(elapsed / 60)).padStart(2, "0")}
              <span style={{ opacity: 0.3 }}>:</span>
              {String(elapsed % 60).padStart(2, "0")}
            </div>
            <div className="font-mono text-[10px] tracking-[0.25em] leading-tight" style={{ color: t.textSoft }}>
              ELAPSED<br />~50s&nbsp;EST
            </div>
          </div>

          {/* Rotating message */}
          <div className="mt-8 mb-8">
            <div className="text-[10px] font-mono tracking-[0.3em]" style={{ color: t.accent }}>
              CURRENT&nbsp;OPERATION
            </div>
            <div className="relative mt-2 h-9 overflow-hidden">
              <div
                key={msgIdx}
                className="absolute inset-0 text-2xl font-light tracking-tight"
                style={{ animation: "msgIn 0.55s ease-out", color: t.text }}
              >
                {WITTY_MESSAGES[msgIdx]}
                <span
                  className="inline-block w-2 h-5 ml-1 align-middle animate-pulse"
                  style={{ background: t.accent }}
                />
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div
              className="flex justify-between items-center mb-2 font-mono text-[10px] tracking-wider"
              style={{ color: t.textSoft }}
            >
              <span>PIPELINE</span>
              <span className="tabular-nums">{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-1.5 w-full relative" style={{ background: t.borderSoft }}>
              <div
                className="absolute inset-y-0 left-0 transition-all duration-200"
                style={{ width: `${progress * 100}%`, background: t.accent }}
              />
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="space-y-3">
            {PIPELINE.map((step, i) => {
              const active = elapsed >= step.at && (PIPELINE[i + 1] ? elapsed < PIPELINE[i + 1].at : true)
              const done   = PIPELINE[i + 1] ? elapsed >= PIPELINE[i + 1].at : false
              return (
                <div key={step.label} className="flex items-center gap-4 font-mono text-[12px]">
                  <div className="w-6 flex justify-center">
                    {done ? (
                      <span style={{ color: t.success }}>✓</span>
                    ) : active ? (
                      <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: t.accent }} />
                    ) : (
                      <span style={{ color: t.textFaint }}>○</span>
                    )}
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span style={{
                      color: done ? t.textSoft : active ? t.text : t.textDim,
                      textDecoration: done ? "line-through" : "none",
                    }}>
                      {step.label}
                    </span>
                    <span className="tabular-nums tracking-wider" style={{ color: t.textDim }}>
                      T+{String(step.at).padStart(2, "0")}s
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={onAbort}
            className="mt-10 self-start text-[11px] font-mono tracking-[0.2em] transition-colors hover:opacity-100"
            style={{ color: t.textSoft }}
          >
            ← ABORT&nbsp;SCAN
          </button>
        </div>
      </div>
    </div>
  )
}
