import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { staticFile } from "remotion";

// 29.0–33.0s · 120 frames · v3 (trimmed)
//
// PDF reveal AND hold combined into one shot. User shortened the hold —
// "we don't need to see it for so long".
// Frames 0–24:   PDF slides up from bottom of frame (0.8s)
// Frames 24–120: PDF holds with subtle Ken-Burns zoom (3.2s hold)
//
// Total: 4.0s

const TOTAL_FRAMES = 120;
const SLIDE_END = 24;

export const Shot11_PdfReveal: React.FC = () => {
  const frame = useCurrentFrame();

  // Slide up from a partially-visible position so the very first frame of
  // this shot already shows the top of the PDF entering — bridges the cut
  // from Shot 10 cleanly without a blank cream pause.
  const slideProgress = interpolate(frame, [0, SLIDE_END], [0, 1], {
    easing: Easing.bezier(0.0, 0.0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(slideProgress, [0, 1], [400, 0]);

  // Slow Ken-Burns zoom after landing
  const kenBurnsScale = interpolate(
    frame,
    [SLIDE_END, TOTAL_FRAMES],
    [1.0, 1.06],
    {
      easing: Easing.bezier(0.4, 0, 0.6, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Drop shadow intensifies as it lands
  const shadowOpacity = interpolate(slideProgress, [0, 1], [0.1, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#F4F6FB", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            transform: `translateY(${translateY}px) scale(${kenBurnsScale})`,
            transformOrigin: "center 30%",
            height: "92%",
            aspectRatio: "850 / 1100",
            background: "white",
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: `0 30px 80px rgba(0,0,0,${shadowOpacity}), 0 8px 24px rgba(0,0,0,${shadowOpacity * 0.7})`,
          }}
        >
          <img
            src={staticFile("pdf-page-1.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
              display: "block",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
