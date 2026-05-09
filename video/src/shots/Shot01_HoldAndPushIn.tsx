import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { IdleScreen } from "../ui/IdleScreen";

// 0.0–2.6s · 78 frames · trimmed from 120f to align click peak with song
// (Shot 1 hold reduced; the saved 42 frames went to Shot 5 scan).
//
// Hold phase  (frames 0–33, 0.0–1.1s):   full-frame IdleScreen at scale 1.0
// Zoom phase  (frames 33–78, 1.1–2.6s):  smooth scale + translate to address bar
//
// No bezel. No discontinuity. One uninterrupted motion that lands at exactly the
// position Shot 2 (macro typing) starts from.

const HOLD_END = 33;
const ZOOM_END = 78;

// End state must match Shot02_MacroTyping starting state:
//   scale 2.4, translateX -40, translateY -250
const END_SCALE = 2.4;
const END_TRANSLATE_X = -40;
const END_TRANSLATE_Y = -250;

export const Shot01_HoldAndPushIn: React.FC = () => {
  const frame = useCurrentFrame();

  const ease = Easing.bezier(0.4, 0, 0.2, 1);

  const scale = interpolate(frame, [HOLD_END, ZOOM_END], [1.0, END_SCALE], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateX = interpolate(
    frame,
    [HOLD_END, ZOOM_END],
    [0, END_TRANSLATE_X],
    {
      easing: ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const translateY = interpolate(
    frame,
    [HOLD_END, ZOOM_END],
    [0, END_TRANSLATE_Y],
    {
      easing: ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Cursor blinks at ~2Hz
  const showCursor = Math.floor(frame / 15) % 2 === 0;

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
        <IdleScreen addressTyped="" showCursor={showCursor} />
      </div>
    </AbsoluteFill>
  );
};
