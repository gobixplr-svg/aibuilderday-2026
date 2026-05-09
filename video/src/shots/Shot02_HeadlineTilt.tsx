import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { IdleScreen } from "../ui/IdleScreen";

// 1.5–2.5s · 30 frames · Headline holds 0.5s, then tilt down toward the address bar
// At frame 0: bezel-less full-frame view of IdleScreen, headline centered
// At frame 30: view has translated up so the address bar approaches center-frame

export const Shot02_HeadlineTilt: React.FC = () => {
  const frame = useCurrentFrame();

  // Hold 15 frames, then tilt down (which means translate the content UP in viewport)
  const translateY = interpolate(frame, [0, 15, 30], [0, 0, -180], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The "from orbit" pulse: subtle scale + glow on the orange "orbit" word
  // (We don't reach into IdleScreen for this — the chime SFX in audio handles the audible cue)

  // Subtle parallax: very small zoom to feel cinematic
  const scale = interpolate(frame, [0, 30], [1.05, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#F4F6FB" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translateY(${translateY}px) scale(${scale})`,
          transformOrigin: "center 40%",
          overflow: "hidden",
          display: "flex",
        }}
      >
        <IdleScreen addressTyped="" showCursor={true} />
      </div>
    </AbsoluteFill>
  );
};
