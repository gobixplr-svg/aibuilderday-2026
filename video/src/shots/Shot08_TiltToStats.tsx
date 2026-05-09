import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { UnifiedResultsPage } from "../ui/UnifiedResultsPage";

// 19.0–21.0s · 60 frames · v3 (rewritten)
//
// Smooth scroll DOWN from the hero close-up to the stats row. Stats are
// rendered as part of UnifiedResultsPage and animate in (slide-up + fade +
// number count-up) driven by phaseFrame. The internal stat thresholds in
// UnifiedResultsPage are set to fire at phaseFrame 130–146.
//
// Camera path:
//   Frames 0–60 (0.0–2.0s): translateY -50 → -260, scale held at 1.3
//
// Phase frame: 135..194

const PHASE_OFFSET = 135;

export const Shot08_TiltToStats: React.FC = () => {
  const frame = useCurrentFrame();
  const phaseFrame = frame + PHASE_OFFSET;

  const ease = Easing.bezier(0.4, 0, 0.2, 1);

  // Scroll DOWN the page (no zoom) to reveal stats row + start of observations
  // section. Stats stagger-fade in (driven by UnifiedResultsPage).
  // At scale 1.0, native y=200 → vp y=200, native y=1080 → vp bottom.
  const scale = 1.0;
  const translateY = interpolate(frame, [0, 60], [0, -100], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#F4F6FB", overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: "center top",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <UnifiedResultsPage phaseFrame={phaseFrame} />
      </div>
    </AbsoluteFill>
  );
};
