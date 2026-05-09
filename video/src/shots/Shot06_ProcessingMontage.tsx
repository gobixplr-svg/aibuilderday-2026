import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { ProcessingScreen } from "../ui/ProcessingScreen";

// Processing montage — internal animations scaled to fill the full 157-frame
// shot duration (was 75/115). Click at video 8.0s pulled the scan start
// earlier; this shot now spans 9.27s to 14.5s = 5.2s of scan.
//
// Sub-beat A (0.0–1.7s of shot, frames 0–50):    timer races 00:00 → 00:28
// Sub-beat B (1.7–3.8s of shot, frames 50–115):  pipeline checklist completes
// Sub-beat C (3.8–5.2s of shot, frames 115–157): scan-sweep + progress 0 → 100%

const TOTAL = 157;

export const Shot06_ProcessingMontage: React.FC = () => {
  const frame = useCurrentFrame();

  // Timer races from 0 → 38 over the full shot, accelerating
  const timerSeconds = interpolate(
    frame,
    [0, 50, TOTAL],
    [0, 28, 38],
    {
      easing: Easing.bezier(0.2, 0.7, 0.4, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Current op index cycles 0..4 over the shot
  const opIdx = Math.min(
    4,
    Math.floor(interpolate(frame, [0, TOTAL - 20], [0, 5], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })),
  );

  // Pipeline active index — items complete at scaled frame milestones
  let pipelineActiveIdx = 0;
  if (frame >= 25) pipelineActiveIdx = 1;
  if (frame >= 50) pipelineActiveIdx = 2;
  if (frame >= 75) pipelineActiveIdx = 3;
  if (frame >= 113) pipelineActiveIdx = 4;
  if (frame >= 146) pipelineActiveIdx = 5;

  // Progress bar fills 0 → 100 over the shot
  const progressPct = interpolate(frame, [0, TOTAL], [0, 100], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scan progress: starts in sub-beat C (frame 115), sweeps top to bottom
  let scanProgress = -1;
  if (frame >= 115) {
    scanProgress = interpolate(frame, [115, TOTAL], [0, 1], {
      easing: Easing.bezier(0.4, 0, 0.6, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  // Subtle Ken-Burns push during sub-beat A
  const scale = interpolate(frame, [0, 50], [1.0, 1.015], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#F4F6FB" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          display: "flex",
        }}
      >
        <ProcessingScreen
          elapsedSeconds={timerSeconds}
          currentOpIndex={opIdx}
          pipelineActiveIdx={pipelineActiveIdx}
          progressPct={progressPct}
          scanProgress={scanProgress}
        />
      </div>
    </AbsoluteFill>
  );
};
