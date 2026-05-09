import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { UnifiedResultsPage } from "../ui/UnifiedResultsPage";

// 14.5–15.0s · 15 frames · v3
//
// Whoosh transition into the unified results page. The page is rendered at
// scale 1.0 (full top visible: header + scan complete + hero + partial stats).
// A radial flash + crossfade overlays the transition. Camera state matches
// the start of Shot 7 so the next zoom-in is perfectly seamless.
//
// Phase frame (post-results phase): 0–14
// (Shot 7 picks up at phaseFrame 15.)

export const Shot07_WhooshResults: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 6, 15], [0, 0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 15], [1.05, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // White flash that fades fast
  const flashOpacity = interpolate(frame, [0, 1, 6], [0, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#F4F6FB", overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: "center top",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <UnifiedResultsPage phaseFrame={frame} />
      </div>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at center, rgba(255,255,255,${flashOpacity}) 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
