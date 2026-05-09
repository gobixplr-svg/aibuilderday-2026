// Light-mode palette copied from components/roof-recon/theme.ts
// (kept as a literal copy so the video has zero runtime dependency on the live app)

export const theme = {
  mode: "light" as const,
  accent: "#FF6B2B",
  bg: "#F4F6FB",
  panel: "#FFFFFF",
  panelAlt: "#EEF2F9",
  panelStrong: "#0D1F3C",
  text: "#0D1F3C",
  textMuted: "rgba(13,31,60,0.7)",
  textSoft: "rgba(13,31,60,0.5)",
  textDim: "rgba(13,31,60,0.38)",
  textFaint: "rgba(13,31,60,0.22)",
  border: "rgba(13,31,60,0.14)",
  borderSoft: "rgba(13,31,60,0.08)",
  gridStrong: "rgba(27,106,201,0.30)",
  gridSoft: "rgba(27,106,201,0.10)",
  accentInk: "#FFFFFF",
  success: "#1F9F4F",
  ribbonInk: "#FFFFFF",
  blue: "#1B6AC9",
};

export type Theme = typeof theme;
