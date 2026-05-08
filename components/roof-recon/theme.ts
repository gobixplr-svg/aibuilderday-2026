export type ThemeMode = "light" | "dark"

export type Theme = ReturnType<typeof getTheme>

export function getTheme(mode: ThemeMode, accent: string) {
  if (mode === "light") {
    return {
      mode: "light" as ThemeMode,
      accent,
      bg:          "#F4F6FB",
      panel:       "#FFFFFF",
      panelAlt:    "#EEF2F9",
      panelStrong: "#0D1F3C",
      text:        "#0D1F3C",
      textMuted:   "rgba(13,31,60,0.7)",
      textSoft:    "rgba(13,31,60,0.5)",
      textDim:     "rgba(13,31,60,0.38)",
      textFaint:   "rgba(13,31,60,0.22)",
      border:      "rgba(13,31,60,0.14)",
      borderSoft:  "rgba(13,31,60,0.08)",
      gridStrong:  "rgba(27,106,201,0.30)",
      gridSoft:    "rgba(27,106,201,0.10)",
      accentInk:   "#FFFFFF",
      success:     "#1F9F4F",
      ribbonInk:   "#FFFFFF",
      blue:        "#1B6AC9",
    }
  }
  return {
    mode: "dark" as ThemeMode,
    accent,
    bg:          "#0D1F3C",
    panel:       "#0D1F3C",
    panelAlt:    "#11264a",
    panelStrong: "#11264a",
    text:        "#FFFFFF",
    textMuted:   "rgba(255,255,255,0.55)",
    textSoft:    "rgba(255,255,255,0.4)",
    textDim:     "rgba(255,255,255,0.3)",
    textFaint:   "rgba(255,255,255,0.18)",
    border:      "rgba(132,170,224,0.18)",
    borderSoft:  "rgba(132,170,224,0.12)",
    gridStrong:  "rgba(132,170,224,0.35)",
    gridSoft:    "rgba(132,170,224,0.12)",
    accentInk:   "#0D1F3C",
    success:     "#5fcb7a",
    ribbonInk:   "#0D1F3C",
    blue:        "#1B6AC9",
  }
}
