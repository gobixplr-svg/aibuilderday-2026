"use client"
import { useState } from "react"
import type { Theme } from "./theme"
import { GridBG } from "./GridBG"

const QUICK_ADDRESSES = [
  "21106 Kenswick Meadows Ct, Humble, TX 77338",
  "5914 Copper Lilly Lane, Spring, TX 77389",
  "122 NW 13th Ave, Cape Coral, FL 33993",
  "14132 Trenton Ave, Orland Park, IL 60462",
  "835 S Cobble Creek, Nixa, MO 65714",
]

type Props = {
  t: Theme
  onSubmit: (address: string) => void
}

export function IdleScreen({ t, onSubmit }: Props) {
  const [addr, setAddr] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (addr.trim()) onSubmit(addr.trim())
  }

  return (
    <div className="relative flex-1 flex flex-col">
      <GridBG t={t} />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Step label */}
        <div className="flex items-center gap-3 mb-10 text-[11px] font-mono tracking-[0.3em]" style={{ color: t.textSoft }}>
          <span className="w-8 h-px" style={{ background: t.border }} />
          <span>STEP&nbsp;01&nbsp;//&nbsp;TARGET&nbsp;ACQUISITION</span>
          <span className="w-8 h-px" style={{ background: t.border }} />
        </div>

        {/* Hero headline */}
        <h1
          className="text-center font-extrabold leading-[0.92] tracking-[-0.03em]"
          style={{ fontSize: "clamp(2.5rem, 6.5vw, 5.75rem)", color: t.text }}
        >
          Measure any roof <br />
          <span className="font-light italic" style={{ color: t.blue }}>from </span>
          <span className="relative inline-block">
            <span className="font-extrabold not-italic" style={{ color: t.accent }}>orbit.</span>
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none">
              <path d="M2 4 Q 100 1, 198 4" stroke={t.accent} strokeWidth="1.5" fill="none" />
            </svg>
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-center leading-relaxed" style={{ color: t.textMuted }}>
          Drop an address. Our AI pulls satellite imagery, traces every gable, ridge, and
          valley, then returns square footage and a priced estimate in under 60 seconds.
        </p>

        {/* Address input */}
        <form onSubmit={handleSubmit} className="relative mt-12 w-full max-w-2xl">
          {/* Corner brackets */}
          {[
            ["top-0 left-0", "border-t border-l"],
            ["top-0 right-0", "border-t border-r"],
            ["bottom-0 left-0", "border-b border-l"],
            ["bottom-0 right-0", "border-b border-r"],
          ].map(([pos, b], i) => (
            <div key={i} className={`absolute w-3 h-3 ${pos} ${b}`} style={{ borderColor: t.accent }} />
          ))}

          <div
            className="flex items-stretch border"
            style={{
              borderColor: t.border,
              background: t.mode === "dark" ? "rgba(13,31,60,0.5)" : "rgba(255,255,255,0.85)",
              backdropFilter: "blur(6px)",
            }}
          >
            {/* Pin icon */}
            <div className="flex items-center pl-5 pr-3 border-r" style={{ borderColor: t.borderSoft }}>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] font-mono tracking-[0.2em]" style={{ color: t.textSoft }}>ADDR</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={t.accent} strokeWidth="1.6">
                  <circle cx="12" cy="10" r="3" />
                  <path d="M12 2 C 7 2 4 5 4 10 c 0 6 8 12 8 12 s 8 -6 8 -12 c 0 -5 -3 -8 -8 -8 z" />
                </svg>
              </div>
            </div>

            <input
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="Enter property address…"
              maxLength={500}
              className="flex-1 bg-transparent px-5 py-5 text-lg outline-none font-medium tracking-tight"
              style={{ color: t.text }}
            />

            <button
              type="submit"
              className="group flex items-center gap-3 px-7 font-semibold tracking-tight transition-colors"
              style={{ background: t.accent, color: t.accentInk }}
            >
              <span>Scan roof</span>
              <span className="font-mono text-xs opacity-70 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* Quick-fill addresses */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-mono">
            <span className="tracking-wider" style={{ color: t.textSoft }}>TRY:</span>
            {QUICK_ADDRESSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setAddr(s)}
                className="px-2 py-1 border transition-colors hover:opacity-100"
                style={{ borderColor: t.borderSoft, color: t.textMuted, opacity: 0.85 }}
              >
                {s}
              </button>
            ))}
          </div>
        </form>

        {/* Capability ticker — single line, mono caps, recon voice. Replaces
            the earlier 3-up icon-card grid that read as generic AI-template. */}
        <div className="mt-12 w-full max-w-3xl flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-[11px] tracking-[0.25em]" style={{ color: t.textSoft }}>
          <span style={{ color: t.accent }}>01</span>
          <span style={{ color: t.text }}>PIXEL-PERFECT</span>
          <span aria-hidden style={{ color: t.borderSoft }}>·</span>
          <span style={{ color: t.accent }}>02</span>
          <span style={{ color: t.text }}>PITCH-AWARE</span>
          <span aria-hidden style={{ color: t.borderSoft }}>·</span>
          <span style={{ color: t.accent }}>03</span>
          <span style={{ color: t.text }}>ESTIMATE-READY</span>
        </div>
      </div>
    </div>
  )
}
