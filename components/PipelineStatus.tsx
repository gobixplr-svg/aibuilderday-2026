"use client"

import { useState, useEffect } from "react"

const MESSAGES = [
  "Calibrating the tape measure…",
  "Arguing with the satellite dish…",
  "Counting shingles from 30,000 feet…",
  "Bribing Google Maps for a better angle…",
  "Asking the drone to hold still…",
  "Consulting a retired roofer…",
  "Triangulating with shadow math…",
  "Reading the ridge lines…",
  "Converting pixels to shingles…",
  "Double-checking the pitch (the roof kind)…",
  "Tracing the footprint from orbit…",
  "Yelling at a cloud (for scale reference)…",
  "Measuring twice, because we're professionals…",
  "Steering the drone past the neighbor's tree…",
]

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function PipelineStatus() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length)
    }, 3000)
    const elapsedTimer = setInterval(() => {
      setElapsed((s) => s + 1)
    }, 1000)
    return () => {
      clearInterval(msgTimer)
      clearInterval(elapsedTimer)
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      {/* Spinner */}
      <div
        className="w-12 h-12 rounded-full border-[3px] animate-spin"
        style={{
          borderColor: "var(--jn-border)",
          borderTopColor: "var(--jn-blue)",
        }}
      />

      {/* Rotating message */}
      <p
        className="text-base font-medium text-center min-h-[1.5rem] transition-opacity"
        style={{ color: "var(--jn-navy)" }}
      >
        {MESSAGES[msgIndex]}
      </p>

      {/* Elapsed */}
      <p className="text-sm font-mono" style={{ color: "var(--jn-muted)" }}>
        {formatElapsed(elapsed)} elapsed
      </p>
    </div>
  )
}
