"use client"

import { useEffect, useRef, useState } from "react"

// Visual narrative for the Solar fence story:
//   Phase 1 (raw):       blurred aerial — "nine houses, can't tell which is yours"
//   Phase 2 (resolving): brief crosshair sweep — Solar API returning the polygon
//   Phase 3 (locked):    sharp aerial with the orange SUBJECT box — disambiguated
//
// The image itself already has the orange box rendered; this component just
// gates how/when it becomes legible. Plays once on scroll-in, then stays
// locked at Phase 3 so a presenter can hover on it as long as needed.
type Props = {
  src: string
  alt: string
  scanColor: string
  accentColor: string
  panelColor: string
}

export function SolarFenceReveal({ src, alt, scanColor, accentColor, panelColor }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<"raw" | "resolving" | "locked">("raw")

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Sequence: 800ms raw → 1200ms resolving → locked
            const t1 = setTimeout(() => setPhase("resolving"), 800)
            const t2 = setTimeout(() => setPhase("locked"), 2000)
            observer.disconnect()
            return () => {
              clearTimeout(t1)
              clearTimeout(t2)
            }
          }
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="relative" style={{ background: panelColor, padding: 16 }}>
      {/* Corner brackets */}
      {[
        ["top-0 left-0", "border-t border-l"],
        ["top-0 right-0", "border-t border-r"],
        ["bottom-0 left-0", "border-b border-l"],
        ["bottom-0 right-0", "border-b border-r"],
      ].map(([pos, b], i) => (
        <div
          key={i}
          className={`absolute w-4 h-4 ${pos} ${b}`}
          style={{ borderColor: accentColor }}
        />
      ))}

      <div className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="block w-full h-auto"
          style={{
            maxHeight: "78vh",
            objectFit: "contain",
            margin: "0 auto",
            filter: phase === "raw" ? "blur(8px) saturate(0.6)" : "blur(0) saturate(1)",
            transform: phase === "raw" ? "scale(1.03)" : "scale(1)",
            transition: "filter 900ms cubic-bezier(0.25, 1, 0.5, 1), transform 900ms cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        />

        {/* Resolving phase: crosshair sweep + corner ticks suggesting Solar API
            "lock acquired" */}
        {phase === "resolving" && (
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <div
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                width: 240,
                height: 240,
                transform: "translate(-50%, -50%)",
                border: `1px dashed ${accentColor}`,
                animation: "fadeMsg 1.2s ease both",
              }}
            />
            <div
              className="absolute left-0 right-0 h-px"
              style={{
                top: "50%",
                background: `linear-gradient(90deg, transparent, ${accentColor}cc, transparent)`,
                animation: "fadeMsg 1.2s ease both",
              }}
            />
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: "50%",
                background: `linear-gradient(180deg, transparent, ${accentColor}cc, transparent)`,
                animation: "fadeMsg 1.2s ease both",
              }}
            />
          </div>
        )}

        {/* Locked phase: ambient scanline sweep — the same one used elsewhere */}
        {phase === "locked" && (
          <div
            aria-hidden
            className="absolute inset-0 overflow-hidden pointer-events-none"
          >
            <div
              className="absolute inset-x-0 h-12"
              style={{
                background: `linear-gradient(180deg, transparent 0%, ${scanColor} 50%, transparent 100%)`,
                animation: "scanline 6s linear infinite",
              }}
            />
          </div>
        )}

        {/* Phase label microtype — burns the narrative into the image so a
            judge glancing at the page knows what they're seeing */}
        <div
          aria-hidden
          className="absolute top-4 left-4 font-mono text-[10px] tracking-[0.3em] px-2 py-1"
          style={{
            background: `${panelColor}cc`,
            color: phase === "locked" ? accentColor : "rgba(255,255,255,0.7)",
            border: `1px solid ${phase === "locked" ? accentColor : "rgba(132,170,224,0.18)"}`,
            transition: "color 400ms ease, border-color 400ms ease",
          }}
        >
          {phase === "raw" && "STATUS // 9 BUILDINGS · NO SUBJECT LOCK"}
          {phase === "resolving" && "STATUS // QUERYING SOLAR API"}
          {phase === "locked" && "STATUS // SUBJECT LOCKED · 21106 KENSWICK MEADOWS CT"}
        </div>
      </div>
    </div>
  )
}
