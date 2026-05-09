import { theme } from "../theme";

// Mirrors the dotted/lined grid feel of components/roof-recon/GridBG.tsx
// Uses CSS background-image with linear-gradients so it renders crisply
// at any scale (camera moves zoom INTO this).

export const GridBG: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(${theme.gridSoft} 1px, transparent 1px),
          linear-gradient(90deg, ${theme.gridSoft} 1px, transparent 1px)
        `,
        backgroundSize: "64px 64px",
        opacity: 0.85,
        pointerEvents: "none",
      }}
    />
  );
};
