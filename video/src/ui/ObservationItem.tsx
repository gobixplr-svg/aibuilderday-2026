import { interpolate, Easing } from "remotion";
import { theme } from "../theme";
import type { Observation } from "../data/demo-property";

// Single observation row with a typewriter-style reveal.
//
// Takes the parent's `currentFrame` explicitly rather than calling
// `useCurrentFrame()` — when this component is rendered inside multiple
// Sequences (Shot 8 + Shot 9 both render UnifiedResultsPage), useCurrentFrame
// would return the local Sequence frame, causing the reveal animation to
// fire once per Sequence. Passing the shot-relative frame from above ensures
// the animation only fires at the correct moment in the timeline.
type Props = {
  observation: Observation;
  appearAtFrame: number;
  currentFrame: number;
};

export const ObservationItem: React.FC<Props> = ({
  observation,
  appearAtFrame,
  currentFrame,
}) => {
  const localFrame = currentFrame - appearAtFrame;

  // Slide-in + fade-in for the row
  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(localFrame, [0, 12], [10, 0], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Detail text typewriter — reveals over 30 frames after row appears
  const charsToShow = Math.floor(
    interpolate(
      localFrame,
      [10, 40],
      [0, observation.detail.length],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ),
  );
  const detailShown = observation.detail.slice(0, charsToShow);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        padding: "12px 14px",
        borderTop: `1px solid ${theme.borderSoft}`,
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 14,
        alignItems: "start",
      }}
    >
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          fontSize: 11,
          color: theme.accent,
          fontWeight: 700,
          letterSpacing: "0.2em",
          paddingTop: 1,
        }}
      >
        {String(observation.id).padStart(2, "0")}
      </div>
      <div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: theme.text,
            marginBottom: 2,
          }}
        >
          {observation.title}
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            color: theme.textMuted,
            lineHeight: 1.45,
          }}
        >
          {detailShown}
          {charsToShow < observation.detail.length && (
            <span style={{ color: theme.accent }}>▌</span>
          )}
        </div>
      </div>
    </div>
  );
};
