"use client"

import { useEffect, useRef, useState } from "react"

// Sequenced reveal of pipeline steps — like a launch checklist lighting up
// row by row. Plays once when the list scrolls into view.
type Props = {
  steps: string[]
  borderColor: string
  borderSoft: string
  panelColor: string
  textColor: string
  accentColor: string
  textMutedColor: string
}

export function PipelineSteps({
  steps,
  borderColor,
  borderSoft,
  panelColor,
  textColor,
  accentColor,
  textMutedColor,
}: Props) {
  const ref = useRef<HTMLOListElement>(null)
  const [activeUpTo, setActiveUpTo] = useState(-1)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // 130ms per step; 9 steps ≈ 1.2s total
            const timers: ReturnType<typeof setTimeout>[] = []
            steps.forEach((_, i) => {
              timers.push(setTimeout(() => setActiveUpTo(i), 130 * (i + 1)))
            })
            observer.disconnect()
            return () => timers.forEach(clearTimeout)
          }
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [steps])

  return (
    <ol ref={ref} className="mt-12 space-y-3">
      {steps.map((line, i) => {
        const active = i <= activeUpTo
        return (
          <li
            key={i}
            className="relative flex items-start gap-6 border px-6 py-5"
            style={{
              borderColor: active ? borderColor : borderSoft,
              background: panelColor,
              opacity: active ? 1 : 0.25,
              transform: active ? "translateX(0)" : "translateX(-8px)",
              transition: "opacity 320ms ease, transform 320ms cubic-bezier(0.25, 1, 0.5, 1), border-color 320ms ease",
            }}
          >
            <div
              className="font-mono text-[14px] tracking-[0.2em] pt-0.5"
              style={{
                color: active ? accentColor : textMutedColor,
                minWidth: 36,
                transition: "color 320ms ease",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="font-mono text-base md:text-lg" style={{ color: textColor }}>
              {line}
            </div>
            {i < steps.length - 1 && (
              <div
                aria-hidden
                className="absolute left-[42px] -bottom-3 w-px h-3"
                style={{ background: borderColor }}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
