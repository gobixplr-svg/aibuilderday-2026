"use client"

import { useEffect, useRef, useState } from "react"

// Counts from 0 to `end` over `duration` ms when scrolled into view.
// Reads as "computation finishing" rather than "decoration."
// IntersectionObserver fires once; once at-rest the counter holds the final value.
type Props = {
  end: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  // Optional override: render this string instead of the numeric end. Useful
  // for fractional displays like "5/5" or "3/5" where we want the final state
  // to be a string but still want a count-up animation on the numerator.
  finalLabel?: string
  className?: string
  style?: React.CSSProperties
}

export function Counter({
  end,
  duration = 1200,
  decimals = 0,
  prefix = "",
  suffix = "",
  finalLabel,
  className,
  style,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!ref.current || done) return
    const el = ref.current
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const start = performance.now()
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration)
              // Ease-out cubic — feels like "settling" not "linear ramp."
              const eased = 1 - Math.pow(1 - t, 3)
              setValue(end * eased)
              if (t < 1) {
                requestAnimationFrame(tick)
              } else {
                setDone(true)
              }
            }
            requestAnimationFrame(tick)
            observer.disconnect()
          }
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [end, duration, done])

  const display = done && finalLabel ? finalLabel : `${prefix}${value.toFixed(decimals)}${suffix}`
  return (
    <span ref={ref} className={className} style={style}>
      {display}
    </span>
  )
}
