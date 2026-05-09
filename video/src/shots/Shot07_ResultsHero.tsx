import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { UnifiedResultsPage } from "../ui/UnifiedResultsPage";

// 15.0–19.0s · 120 frames · v3 (revised — no zoom)
//
// Holds the full results page at scale 1.0 with translateY 0. The hero number
// counts up + reticle locks (driven internally by UnifiedResultsPage). The
// full screen is visible the whole time — header, SCAN COMPLETE, hero+aerial,
// stats partially visible. No zoom anywhere. The user sees everything.
//
// Phase frame: 15..134

const PHASE_OFFSET = 15;

export const Shot07_ResultsHero: React.FC = () => {
  const frame = useCurrentFrame();
  const phaseFrame = frame + PHASE_OFFSET;

  const scale = 1.0;
  const translateY = 0;

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
