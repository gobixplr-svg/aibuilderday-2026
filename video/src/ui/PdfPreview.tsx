import { staticFile, interpolate, useCurrentFrame, Easing } from "remotion";

// PDF reveal — slide up from bottom, settle center-frame, then slow Ken-Burns
// hold. Visual matches reference/pdfdesign.png since the PNG was Puppeteer-rendered
// from the same estimate.html that generates the real PDF.
//
// Local frame must be passed in — the shot owns its own timing.

type Props = {
  // Local frame within Shot 11 (0..75)
  shotFrame: number;
  // Shot 11 duration
  totalFrames: number;
};

export const PdfPreview: React.FC<Props> = ({ shotFrame, totalFrames }) => {
  // Slide up from below frame to landing position (frames 0–24)
  const slideProgress = interpolate(shotFrame, [0, 24], [0, 1], {
    easing: Easing.bezier(0.0, 0.0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(slideProgress, [0, 1], [1100, 0]);

  // Slow Ken-Burns zoom after landing (frames 24..end)
  const kenBurnsScale = interpolate(
    shotFrame,
    [24, totalFrames],
    [1.0, 1.04],
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
  );
};
