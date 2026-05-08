import type { Theme } from "./theme"

export function GridBG({ t, show = true }: { t: Theme; show?: boolean }) {
  if (!show) return null
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: t.mode === "light" ? 0.55 : 0.18,
        backgroundImage: `
          linear-gradient(${t.gridStrong} 1px, transparent 1px),
          linear-gradient(90deg, ${t.gridStrong} 1px, transparent 1px),
          linear-gradient(${t.gridSoft} 1px, transparent 1px),
          linear-gradient(90deg, ${t.gridSoft} 1px, transparent 1px)
        `,
        backgroundSize: "120px 120px, 120px 120px, 24px 24px, 24px 24px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
      }}
    />
  )
}
