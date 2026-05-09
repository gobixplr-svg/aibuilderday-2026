import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { TabletFrame } from "../ui/TabletFrame";
import { IdleScreen } from "../ui/IdleScreen";

// 0.0–1.5s · 45 frames · Establishing tablet shot, then push-in begins
// At frame 0: tablet visible, ~58% of frame width, slight tilt
// At frame 12 (~0.4s): start dolly-in
// At frame 45: tablet has scaled up so the screen content fills the frame edges

export const Shot01_EstablishingPushIn: React.FC = () => {
  const frame = useCurrentFrame();

  // Push-in scale: holds at ~1.0 then accelerates
  const scale = interpolate(frame, [0, 12, 45], [1.0, 1.0, 2.4], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slight Z-axis tilt that lifts as we push in
  const tilt = interpolate(frame, [0, 12, 45], [-6, -6, 0], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          transform: `perspective(2400px) rotateX(${tilt}deg) scale(${scale})`,
          transformOrigin: "center 55%",
        }}
      >
        <TabletFrame width={1120} height={780}>
          <IdleScreen addressTyped="" showCursor={true} />
        </TabletFrame>
      </div>
    </AbsoluteFill>
  );
};
