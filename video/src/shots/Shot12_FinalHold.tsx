import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { PdfPreview } from "../ui/PdfPreview";

// 29.0–30.0s · 30 frames · NEW v2 shot
//
// Final hold — PDF stays center-frame, ambient cream background, music resolves.
// The "Powered by JobNimbus" badge already on the PDF page acts as the brand stamp.
// Optional gentle fade at the very end (last 6 frames) to silence/black for clean cut.

export const Shot12_FinalHold: React.FC = () => {
  const frame = useCurrentFrame();

  // Continue Ken-Burns from where Shot 11 left off, very subtle
  const kenBurnsScale = interpolate(frame, [0, 30], [1.04, 1.06], {
    easing: Easing.bezier(0.4, 0, 0.6, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Optional gentle fade-out at the very end
  const opacity = interpolate(frame, [24, 30], [1.0, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#F4F6FB", overflow: "hidden", opacity }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${kenBurnsScale})`,
          transformOrigin: "center 30%",
        }}
      >
        {/* Pass synthetic "settled" frame to keep PDF in landed state */}
        <PdfPreview shotFrame={75} totalFrames={75} />
      </div>
    </AbsoluteFill>
  );
};
