"use client"
import { useEffect, useRef, useState } from "react"
import type { Theme } from "./theme"
import { GridBG } from "./GridBG"
import { Reticle } from "./Reticle"
import { SatelliteFrame } from "./SatelliteFrame"
import { slugify } from "@/app/lib/slug"

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

// Sequenced phase labels. The pipeline doesn't expose per-step progress to
// the client (it's a single spawn that resolves at the end), so phases are
// driven by elapsed time + the aerial-poll signal, not by real step events.
// Phases 1-2 are time-anchored (we know the aerial polls back within ~5-10s);
// phases 3-5 are tied to the asymptotic progress curve.
const PHASES = [
  { label: "Locating address",          startAt: 0  },
  { label: "Fetching satellite tile",   startAt: 3  },
  { label: "Identifying subject roof",  startAt: 12 },
  { label: "Estimating pitch & area",   startAt: 30 },
  { label: "Generating 3-tier estimate",startAt: 90 },
]

// Asymptotic progress: pipeline is 90-220s but mostly clusters around 120s.
// 1 - exp(-elapsed/TAU) with TAU=70 reaches ~75% at 100s, ~86% at 140s,
// ~93% at 180s. Caps at 95% so the bar visibly completes when results land.
const TAU = 70
const PROGRESS_CAP = 0.95

type Props = {
  t: Theme
  address: string
  onAbort: () => void
}

export function ProcessingScreen({ t, address, onAbort }: Props) {
  const startRef = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [aerialUrl, setAerialUrl] = useState<string | null>(null)

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 200)
    return () => clearInterval(id)
  }, [])

  // Poll for the cached aerial. Once /api/aerial returns 200 we have the
  // real fetched satellite tile and stop polling.
  useEffect(() => {
    let cancelled = false
    const slug = slugify(address)
    const url = `/api/aerial?address=${encodeURIComponent(address)}`
    const tick = async () => {
      if (cancelled || aerialUrl) return
      try {
        const res = await fetch(url, { cache: "no-store" })
        if (!cancelled && res.ok) {
          // Cache-bust to force the <img> to render the just-arrived bitmap.
          setAerialUrl(`${url}&_=${Date.now()}`)
        }
      } catch {
        // Network blip — try again next tick.
      }
    }
    // First check at 2s, then every 2s up to 20s. After that the aerial is
    // either present or the fetch genuinely failed; either way nothing useful
    // happens by polling further during the vision phase.
    const id = setInterval(tick, 2000)
    const first = setTimeout(tick, 1000)
    const stop = setTimeout(() => clearInterval(id), 25_000)
    return () => {
      cancelled = true
      clearInterval(id)
      clearTimeout(first)
      clearTimeout(stop)
    }
  }, [address, aerialUrl])

  // Typewriter effect
  useEffect(() => {
    const msg = WITTY_MESSAGES[msgIdx]
    if (!deleting) {
      if (charIdx < msg.length) {
        const id = setTimeout(() => setCharIdx((c) => c + 1), 42)
        return () => clearTimeout(id)
      } else {
        const id = setTimeout(() => setDeleting(true), 1600)
        return () => clearTimeout(id)
      }
    } else {
      if (charIdx > 0) {
        const id = setTimeout(() => setCharIdx((c) => c - 1), 18)
        return () => clearTimeout(id)
      } else {
        setMsgIdx((i) => (i + 1) % WITTY_MESSAGES.length)
        setDeleting(false)
      }
    }
  }, [charIdx, deleting, msgIdx])

  const displayText = WITTY_MESSAGES[msgIdx].slice(0, charIdx)
  const progress = Math.min(1 - Math.exp(-elapsed / TAU), PROGRESS_CAP)

  // Treat the aerial-poll arrival as the signal that phase 2 ("Fetching
  // satellite tile") completed, regardless of the time-based start. Phases
  // 3+ remain time-driven since we have no per-step signal from the API.
  const phaseStarted = (i: number) => {
    if (i === 1) return aerialUrl !== null || elapsed >= PHASES[1].startAt
    return elapsed >= PHASES[i].startAt
  }
  const phaseDone = (i: number) => {
    if (i === 0) return aerialUrl !== null || elapsed >= PHASES[1].startAt
    if (i === 1) return aerialUrl !== null && elapsed >= PHASES[2].startAt
    return PHASES[i + 1] ? elapsed >= PHASES[i + 1].startAt : false
  }

  const shortAddress = address.split(",")[0].toUpperCase()

  return (
    <div className="relative flex-1 flex flex-col">
      <GridBG t={t} />
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">

        {/* Left: satellite view */}
        <div className="relative p-8 lg:p-12 flex flex-col">
          <div className="text-[10px] font-mono tracking-[0.3em] mb-3" style={{ color: t.textSoft }}>
            RECON&nbsp;BUFFER&nbsp;//&nbsp;{shortAddress}
          </div>

          <div className="relative flex-1 min-h-[360px] border" style={{ borderColor: t.border }}>
            <SatelliteFrame scanning accent={t.accent} imageUrl={aerialUrl} />
            <div className="absolute inset-0 grid place-items-center">
              <Reticle size={260} scanning color={t.accent} />
            </div>
            {/* HUD overlays. Static labels only — no fake coords, no fake frame
                counter. The actual aerial source is Google Static Maps zoom 20
                with scale=2 (effective 1280px), which IS ~0.06m/px — those
                figures are honest. */}
            <div className="absolute top-3 left-3 font-mono text-[10px] tracking-wider text-white/70 leading-snug">
              <div>SOURCE: GOOGLE&nbsp;STATIC&nbsp;MAPS</div>
              <div>ZOOM 20 / 0.06m/px</div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between font-mono text-[10px] tracking-wider text-white/60">
              <div>{aerialUrl ? "TILE LOCKED" : "AWAITING TILE…"}</div>
              {aerialUrl && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.accent }} />
                  ANALYZING
                </div>
              )}
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
              ELAPSED<br />LIVE&nbsp;RUN
            </div>
          </div>

          {/* Rotating message */}
          <div className="mt-8 mb-8">
            <div className="text-[10px] font-mono tracking-[0.3em]" style={{ color: t.accent }}>
              CURRENT&nbsp;OPERATION
            </div>
            <div className="relative mt-2 h-9 overflow-hidden">
              <div
                className="absolute inset-0 text-2xl font-light tracking-tight"
                style={{ color: t.text }}
              >
                {displayText}
                <span
                  className="inline-block w-2 h-5 ml-0.5 align-middle"
                  style={{ background: t.accent, opacity: deleting ? 0.5 : 1 }}
                />
              </div>
            </div>
          </div>

          {/* Progress bar (asymptotic — see TAU constant). The displayed
              percentage is a wall-clock proxy, not a real per-step progress
              signal; it caps at PROGRESS_CAP so the bar visibly completes
              when results land. */}
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

          {/* Pipeline steps. No fake T+Ns timestamps — those promised a
              schedule we don't actually keep. Just sequential lighting. */}
          <div className="space-y-3">
            {PHASES.map((phase, i) => {
              const started = phaseStarted(i)
              const done = phaseDone(i)
              const active = started && !done
              return (
                <div key={phase.label} className="flex items-center gap-4 font-mono text-[12px]">
                  <div className="w-6 flex justify-center">
                    {done ? (
                      <span style={{ color: t.success }}>✓</span>
                    ) : active ? (
                      <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: t.accent }} />
                    ) : (
                      <span style={{ color: t.textFaint }}>○</span>
                    )}
                  </div>
                  <span style={{
                    color: done ? t.textSoft : active ? t.text : t.textDim,
                    textDecoration: done ? "line-through" : "none",
                  }}>
                    {phase.label}
                  </span>
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
