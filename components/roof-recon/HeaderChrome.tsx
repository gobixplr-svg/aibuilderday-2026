import type { Theme, ThemeMode } from "./theme"
import { ThemeToggle } from "./ThemeToggle"

type Props = {
  t: Theme
  themeMode: ThemeMode
  onThemeChange: (mode: ThemeMode) => void
}

export function HeaderChrome({ t, themeMode, onThemeChange }: Props) {
  return (
    <div
      className="relative z-10 flex items-center justify-between px-8 py-5 border-b"
      style={{ borderColor: t.border }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 grid place-items-center" style={{ background: t.accent }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={t.accentInk} strokeWidth="2.5">
            <path d="M3 12 L12 4 L21 12" />
            <path d="M5 11 L5 20 L19 20 L19 11" />
          </svg>
        </div>
        <div className="leading-none">
          <div className="text-[11px] tracking-[0.2em] font-semibold" style={{ color: t.text }}>JOBNIMBUS</div>
          <div className="text-[10px] tracking-[0.3em] mt-1 font-mono" style={{ color: t.accent }}>ROOF&nbsp;RECON</div>
        </div>
      </div>

      {/* Right: status + toggle */}
      <div className="flex items-center gap-6 text-[11px] font-mono tracking-wider" style={{ color: t.textSoft }}>
        <div className="hidden lg:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.success }} />
          <span>SAT&nbsp;LINK&nbsp;LIVE</span>
        </div>
        <div className="hidden md:block">v0.4.2&nbsp;//&nbsp;HACKATHON</div>
        <ThemeToggle mode={themeMode} onChange={onThemeChange} t={t} />
      </div>
    </div>
  )
}
