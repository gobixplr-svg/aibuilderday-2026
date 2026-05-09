import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { UnifiedResultsPage } from "../ui/UnifiedResultsPage";

// 27.0–30.5s · 105 frames · v3 (final revision)
//
// Per user feedback:
//  - No cursor — replaced with an Apple-style button-press animation on the
//    Download PDF button (compress + glow ripple, identical pattern to the
//    Scan roof button at the start of the spot).
//  - Don't scroll past the AI vision report; hold at Shot 9's end position
//    so observations + pricing are visible together.
//  - Hold for 1–1.5s so the user reads the pricing, then click + zoom in on
//    the Download button to lead into the PDF reveal.
//
// Camera path:
//   Frames 0–25  (0.0–0.83s): hold at translateY -580, scale 1.0
//                              (briefer pricing hold — user wanted less time here)
//   Frames 25–75 (0.83–2.5s): smooth zoom-in to button at viewport center
//                              scale 1.0 → 1.7, ty → -768, tx → -724
//   Frames 75–90 (2.5–3.0s):  button click animation fires (DownloadPdfButton
//                              internally at phaseFrame 450–470, hero-sized)
//   Frames 90–105 (3.0–3.5s): hold at zoomed state before Shot 11 PDF reveal
//
// Download button native: x ≈ 1684, y ≈ 1086 (top-right of pricing section)
// At end of zoom: button at vp (960, 540), filling the upper-center of frame.

// Shot 9 was reduced by 45 frames (1.5s of pricing dwell trimmed),
// so Shot 10's phase offset shifted from 375 → 330.
const PHASE_OFFSET = 330;

export const Shot10_DownloadClick: React.FC = () => {
  const frame = useCurrentFrame();
  const phaseFrame = frame + PHASE_OFFSET;

  const ease = Easing.bezier(0.4, 0, 0.2, 1);

  // Hold 0–25, zoom 25–75, hold zoomed 75–105
  const scale = interpolate(frame, [0, 25, 75, 105], [1.0, 1.0, 1.7, 1.7], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(
    frame,
    [0, 25, 75, 105],
    [-580, -580, -768, -768],
    {
      easing: ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const translateX = interpolate(frame, [0, 25, 75, 105], [0, 0, -724, -724], {
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
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
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
