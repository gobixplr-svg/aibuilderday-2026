import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { IdleScreen } from "../ui/IdleScreen";
import { demoProperty } from "../data/demo-property";

// 9.0–10.17s · 35 frames (was 45 — trimmed 10 frames so click hits earlier)
//
// User wants the click peak to land at exactly video frame 282 = 9.4s
// (= "9:12" at 30fps: 9 seconds, 12 frames). The 10 frames removed from
// here are added to Shot 5 (scan) so total runtime is unchanged.
//
// Internal timing (within the 35-frame shot):
//   Frames 0–8:    pan to button (faster than v3's 18-frame pan)
//   Frame 12:      click peak — button at scale 0.96, glow at 1.0
//                  → video frame 270 + 12 = 282 = 9.4s ✓
//   Frames 12–15:  bounce 0.96 → 1.05
//   Frames 15–18:  settle 1.05 → 1.0
//   Frames 18–35:  hold (settled), glow ripple decays

export const Shot04_PanCTAClick: React.FC = () => {
  const frame = useCurrentFrame();

  // Camera pan from address bar to button — 8 frames (was 18)
  const translateX = interpolate(frame, [0, 8], [-40, -240], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = -250;

  // Slight push-in on the click moment
  const scale = interpolate(frame, [0, 8, 12, 35], [2.4, 2.4, 2.55, 2.55], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Button press animation — peak compress at frame 12 (= video frame 282)
  let buttonScale = 1;
  if (frame >= 9 && frame < 12) {
    buttonScale = interpolate(frame, [9, 12], [1, 0.96], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else if (frame >= 12 && frame < 15) {
    buttonScale = interpolate(frame, [12, 15], [0.96, 1.05], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else if (frame >= 15) {
    buttonScale = interpolate(frame, [15, 18], [1.05, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  // Glow ripple — peaks at frame 12 (the click) and decays
  const buttonGlow = interpolate(frame, [9, 12, 25], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#F4F6FB", overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: "center center",
          display: "flex",
        }}
      >
        <IdleScreen
          addressTyped={demoProperty.address}
          showCursor={false}
          buttonScale={buttonScale}
          buttonGlow={buttonGlow}
        />
      </div>
    </AbsoluteFill>
  );
};
