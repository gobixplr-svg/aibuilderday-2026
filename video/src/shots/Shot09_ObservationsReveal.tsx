import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { UnifiedResultsPage } from "../ui/UnifiedResultsPage";

// 21.0–27.0s · 180 frames · v3 (rewritten)
//
// Continue scrolling down from the stats area to the observations card.
// Observations populate one-by-one (driven by ConditionCardExpanded inside
// UnifiedResultsPage). Held long enough for the viewer to read each finding.
//
// Camera path:
//   Frames 0–45 (0.0–1.5s): translateY -260 → -560, smooth scroll
//   Frames 45–180 (1.5–6.0s): translateY -560, hold while observations populate
//
// Phase frame: 195..374
// (Observations appear at phaseFrame 9, 27, 45 RELATIVE TO ConditionCardExpanded
//  start. ConditionCardExpanded gets shotFrame = phaseFrame - 180. So
//  observations appear at phaseFrame 189, 207, 225 — well within this shot.)

const PHASE_OFFSET = 195;

export const Shot09_ObservationsReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const phaseFrame = frame + PHASE_OFFSET;

  const ease = Easing.bezier(0.4, 0, 0.2, 1);

  // Continue scrolling DOWN at scale 1.0 (no zoom) to bring the observations
  // card to center of viewport, then hold. The whole card and surrounding
  // context stays visible.
  const scale = 1.0;
  const translateY = interpolate(
    frame,
    [0, 45, 180],
    [-100, -580, -580],
    {
      easing: ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

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
