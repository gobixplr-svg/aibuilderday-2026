import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { ProcessingScreen } from "../ui/ProcessingScreen";

// 6.5–7.0s · 15 frames · Whoosh transition into ProcessingScreen
// Radial wipe from center outward + motion blur feel via opacity + scale

export const Shot05_WhooshProcessing: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 8, 15], [0, 0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 15], [1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Radial flash — bright orange flash that fades quickly
  const flashOpacity = interpolate(frame, [0, 2, 7], [0, 0.4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#F4F6FB" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          opacity,
          transform: `scale(${scale})`,
          display: "flex",
        }}
      >
        <ProcessingScreen
          elapsedSeconds={0}
          currentOpIndex={0}
          pipelineActiveIdx={0}
          progressPct={0}
          scanProgress={-1}
        />
      </div>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at center, rgba(255,107,43,${flashOpacity}) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
