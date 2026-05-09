"use client"
import { useEffect, useState } from "react"
import type { Theme } from "./theme"
import { GridBG } from "./GridBG"
import { Reticle } from "./Reticle"
import { SatelliteFrame } from "./SatelliteFrame"
import { slugify } from "@/app/lib/slug"

type TierData = {
  key: "standard" | "premium" | "luxury"
  name: string
  tag: string
  price: number
  perSqft: number
  warranty: string
  bullets: string[]
}

// Static tier metadata — prices come from the API, rest is hardcoded
const TIER_META: Omit<TierData, "price" | "perSqft">[] = [
  {
    key: "standard",
    name: "Standard",
    tag: "Architectural asphalt",
    warranty: "25-yr",
    bullets: [
      "3-tab + dimensional shingles",
      "Standard underlayment",
      "Basic flashing replacement",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    tag: "Impact-rated composite",
    warranty: "40-yr",
    bullets: [
      "Class 4 impact-rated shingles",
      "Synthetic underlayment + ice shield",
      "Ridge vent + step flashing",
      "10-yr workmanship warranty",
    ],
  },
  {
    key: "luxury",
    name: "Luxury",
    tag: "Standing seam metal",
    warranty: "50-yr",
    bullets: [
      "24-gauge standing seam panels",
      "Full tear-off + deck inspection",
      "Concealed fastener system",
      "Lifetime workmanship warranty",
    ],
  },
]

type ApiTier = {
  name: string
  total: number
  per_sqft?: number
}

type Result = {
  address: string
  sqft: number
  footprint_sqft?: number | null
  footprint_confidence?: number | null
  pitch: string
  pitch_confidence: number
  tiers: ApiTier[]
  stub?: boolean
}

type Props = {
  t: Theme
  result: Result
  onReset: () => void
}

export function ResultsScreen({ t, result, onReset }: Props) {
  const { address, sqft, footprint_sqft, pitch, pitch_confidence, tiers, stub } = result
  const [revealed, setRevealed] = useState(0)

  // Count-up animation
  useEffect(() => {
    setRevealed(0)
    const duration = 1400
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const tt = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - tt, 3)
      setRevealed(Math.round(sqft * eased))
      if (tt < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [sqft])

  // Merge API tier prices with static metadata
  const mergedTiers: TierData[] = TIER_META.map((meta) => {
    const api = tiers.find((t) => t.name.toLowerCase() === meta.name.toLowerCase())
    return {
      ...meta,
      price: api?.total ?? 0,
      perSqft: api?.per_sqft ?? (api?.total ? api.total / sqft : 0),
    }
  })

  return (
    <div className="relative flex-1 flex flex-col overflow-y-auto">
      <GridBG t={t} />
      <div className="relative z-10 flex-1 px-6 lg:px-12 py-10 lg:py-14 max-w-[1280px] mx-auto w-full">

        {/* Stub warning */}
        {stub && (
          <div
            className="mb-6 px-4 py-3 text-sm font-mono"
            style={{
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: 10,
              color: "#92400E",
              letterSpacing: "0.02em",
            }}
          >
            ⚠️ Stub data — pitch and footprint are synthetic until vision prompts land
          </div>
        )}

        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-10">
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.25em]" style={{ color: t.textSoft }}>
            <span className="px-2 py-1 border" style={{ borderColor: t.border, color: t.success }}>
              ● SCAN&nbsp;COMPLETE
            </span>
            <span className="uppercase">RPT/{slugify(address).slice(0, 24)}</span>
            <span className="hidden md:inline">{address}</span>
          </div>
          <button
            onClick={onReset}
            className="font-mono text-[10px] tracking-[0.2em] transition-colors hover:opacity-100"
            style={{ color: t.textSoft }}
          >
            ↻ NEW&nbsp;SCAN
          </button>
        </div>

        {/* Hero: sqft + satellite */}
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-center mb-14">
          <div>
            <div className="text-[11px] font-mono tracking-[0.3em] mb-3" style={{ color: t.textSoft }}>
              TOTAL&nbsp;ROOF&nbsp;AREA
            </div>
            <div className="relative">
              <div
                className="font-extrabold tracking-[-0.05em] tabular-nums leading-[0.85]"
                style={{ fontSize: "clamp(5rem, 16vw, 11.5rem)", color: t.text }}
              >
                {revealed.toLocaleString()}
              </div>
              <div className="absolute -right-2 lg:right-6 top-2 text-right">
                <div className="text-2xl lg:text-3xl font-light tracking-tight" style={{ color: t.textSoft }}>sq ft</div>
              </div>
              <div className="absolute -top-3 -left-3 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: t.accent }} />
              <div className="absolute -bottom-3 -left-3 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: t.accent }} />
            </div>

            {/* Stats grid — all real values from pipeline */}
            <div className="mt-8 grid grid-cols-3 gap-px max-w-lg" style={{ background: t.border }}>
              {([
                ["PITCH",      pitch,                                    "roof slope"],
                ["CONFIDENCE", `${Math.round(pitch_confidence * 100)}%`, "AI estimate"],
                ["FOOTPRINT",  footprint_sqft ? `${footprint_sqft.toLocaleString()}` : "—", "sq ft base"],
              ] as [string, string, string][]).map(([k, v, sub]) => (
                <div key={k} className="px-4 py-4" style={{ background: t.bg }}>
                  <div className="text-[9px] font-mono tracking-[0.25em]" style={{ color: t.textSoft }}>{k}</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums" style={{ color: t.text }}>{v}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: t.textSoft }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Satellite panel */}
          <div className="relative aspect-square w-full max-w-sm justify-self-center lg:justify-self-end">
            <div className="absolute inset-0 border-2" style={{ borderColor: t.accent }} />
            <SatelliteFrame locked accent={t.accent} />
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <Reticle size={220} locked color={t.accent} />
            </div>
            <div
              className="absolute -bottom-7 left-0 right-0 flex justify-between font-mono text-[10px] tracking-wider"
              style={{ color: t.textSoft }}
            >
              <span>● TARGET&nbsp;LOCKED</span>
              <span>0.3m/px</span>
            </div>
          </div>
        </div>

        {/* Estimate tiers */}
        <div className="mt-20 mb-6 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-mono tracking-[0.3em]" style={{ color: t.textSoft }}>ESTIMATE&nbsp;TIERS</div>
            <h2 className="mt-1 text-2xl lg:text-3xl font-semibold tracking-tight" style={{ color: t.text }}>
              Three options. One roof.
            </h2>
          </div>
          <a
            href={`/api/pdf?address=${encodeURIComponent(address)}`}
            download
            className="hidden md:flex items-center gap-2 px-5 py-3 font-semibold text-sm tracking-tight transition-opacity hover:opacity-90"
            style={{ background: t.accent, color: t.accentInk }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 4 v 12 m -5 -5 l 5 5 l 5 -5 M 4 20 h 16" />
            </svg>
            Download estimate PDF
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mergedTiers.map((ti) => {
            const featured = ti.key === "premium"
            const cardBg       = featured ? t.panelStrong : t.panel
            const cardText     = featured ? "#FFFFFF" : t.text
            const cardMuted    = featured ? "rgba(255,255,255,0.55)" : t.textMuted
            const cardSoft     = featured ? "rgba(255,255,255,0.4)" : t.textSoft
            return (
              <div
                key={ti.key}
                className={`relative flex flex-col p-6 transition-transform ${featured ? "md:-translate-y-3 md:scale-[1.03]" : ""}`}
                style={{
                  background: cardBg,
                  border: featured ? `1.5px solid ${t.accent}` : `1px solid ${t.border}`,
                  boxShadow: featured
                    ? `0 30px 60px -30px ${t.accent}66`
                    : t.mode === "light" ? "0 1px 2px rgba(13,31,60,0.04)" : "none",
                }}
              >
                {featured && (
                  <div
                    className="absolute -top-3 left-6 px-2 py-1 text-[10px] font-mono tracking-[0.2em]"
                    style={{ background: t.accent, color: t.accentInk }}
                  >
                    RECOMMENDED
                  </div>
                )}
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-semibold tracking-tight" style={{ color: cardText }}>{ti.name}</div>
                  <div className="text-[10px] font-mono tracking-wider" style={{ color: cardSoft }}>{ti.warranty}</div>
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: cardMuted }}>{ti.tag}</div>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-[14px] font-mono" style={{ color: cardSoft }}>$</span>
                  <span className="text-5xl font-extrabold tracking-[-0.03em] tabular-nums" style={{ color: cardText }}>
                    {ti.price.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] font-mono mt-1" style={{ color: cardSoft }}>
                  ${ti.perSqft.toFixed(2)} / sq ft&nbsp;·&nbsp;{sqft.toLocaleString()} sq ft
                </div>

                <ul className="mt-6 space-y-2 text-sm flex-1" style={{ color: cardMuted }}>
                  {ti.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 shrink-0" style={{ background: featured ? t.accent : t.blue }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Footer — mobile-only PDF download since the desktop button is in the
            tier-row header. Removed non-functional CTAs (SHARE LINK / EMAIL /
            SEND TO CRM) — those were cosmetic, clicking them did nothing. */}
        <div
          className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t font-mono text-[10px] tracking-wider"
          style={{ borderColor: t.border, color: t.textSoft }}
        >
          <div>ESTIMATE&nbsp;VALID&nbsp;30&nbsp;DAYS&nbsp;·&nbsp;LOCAL&nbsp;LABOR&nbsp;RATES&nbsp;APPLIED</div>
          <a
            href={`/api/pdf?address=${encodeURIComponent(address)}`}
            download
            className="md:hidden font-mono text-[10px] tracking-[0.2em] underline-offset-2 hover:no-underline"
            style={{ color: t.accent }}
          >
            ↓ DOWNLOAD&nbsp;PDF
          </a>
        </div>
      </div>
    </div>
  )
}
