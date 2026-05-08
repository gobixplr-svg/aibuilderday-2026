"use client"
import type { Theme, ThemeMode } from "./theme"

type Props = {
  mode: ThemeMode
  onChange: (mode: ThemeMode) => void
  t: Theme
}

export function ThemeToggle({ mode, onChange, t }: Props) {
  return (
    <button
      onClick={() => onChange(mode === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative flex items-center transition-colors"
      style={{
        width: 64,
        height: 28,
        borderRadius: 999,
        border: `1px solid ${t.border}`,
        background: t.mode === "dark" ? "rgba(132,170,224,0.08)" : "rgba(13,31,60,0.04)",
      }}
    >
      {/* Sun icon (left side) */}
      <span
        style={{
          position: "absolute",
          left: 8,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: mode === "light" ? 0 : 0.5,
          transition: "opacity 0.2s",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </span>

      {/* Moon icon (right side) */}
      <span
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: mode === "dark" ? 0 : 0.5,
          transition: "opacity 0.2s",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      </span>

      {/* Sliding knob */}
      <span
        style={{
          position: "absolute",
          left: mode === "dark" ? 2 : 36,
          top: 2,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: t.accent,
          transition: "left 0.22s cubic-bezier(.4,.0,.2,1)",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={t.accentInk} strokeWidth="2.5" strokeLinecap="round">
          {mode === "dark" ? (
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </>
          )}
        </svg>
      </span>
    </button>
  )
}
