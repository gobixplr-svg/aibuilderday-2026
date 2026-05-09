import { AbsoluteFill, useCurrentFrame, interpolate, Easing, staticFile } from "remotion";
import { theme } from "../theme";

// 33.0–36.0s · 90 frames · v3 outro (revised — bigger ROOF RECON, hard cut to black)
//
// Frames 0–18  (0.0–0.6s): logo + text fade in over cream bg
// Frames 18–75 (0.6–2.5s): hold — let the brand land
// Frames 75–90 (2.5–3.0s): HARD CUT to pure black (no fade)

const HARD_CUT_FRAME = 75;

export const Shot12_Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = Easing.bezier(0.4, 0, 0.2, 1);

  // Logo + text fade in (only — no fade out)
  const contentOpacity = interpolate(frame, [0, 18], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle scale-in on entrance for a touch of polish
  const contentScale = interpolate(frame, [0, 18], [0.96, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // After HARD_CUT_FRAME, render pure black (instant cut)
  if (frame >= HARD_CUT_FRAME) {
    return <AbsoluteFill style={{ background: "#000000" }} />;
  }

  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          opacity: contentOpacity,
          transform: `scale(${contentScale})`,
        }}
      >
        <img
          src={staticFile("jobnimbus-logo.png")}
          style={{
            width: 560,
            height: "auto",
            display: "block",
          }}
        />
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            color: theme.accent,
            letterSpacing: "0.18em",
            fontSize: 96,
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          Roof Recon
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
