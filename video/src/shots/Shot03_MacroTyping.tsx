import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { IdleScreen } from "../ui/IdleScreen";
import { demoProperty } from "../data/demo-property";

// 2.5–5.5s · 90 frames · MACRO TYPING — close-up of address input
// Camera is zoomed in 2.4x and panned so the input bar fills the frame.
// "3561 E 102nd Ct, Thornton, CO 80229" types char-by-char at ~3 frames/char.

const FULL_ADDRESS = demoProperty.address;

export const Shot03_MacroTyping: React.FC = () => {
  const frame = useCurrentFrame();

  // 90 frames total, 30 chars in address — ~3 frames per char
  // Reserve 4 frames at start for "settling in" and 8 frames at end for final hold
  const typingStart = 4;
  const typingEnd = 82;
  const charsToShow = Math.floor(
    interpolate(frame, [typingStart, typingEnd], [0, FULL_ADDRESS.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typed = FULL_ADDRESS.slice(0, charsToShow);

  // Cursor blinks at ~2Hz (every 15 frames toggle)
  const showCursor = Math.floor(frame / 15) % 2 === 0;

  // Subtle breathing zoom: 2.4 -> 2.42 -> 2.4 over 5s period
  const breathing = Math.sin((frame / 90) * Math.PI) * 0.02;
  const scale = 2.4 + breathing;

  // Camera position — center on the address bar, which sits below center
  // in the IdleScreen layout. Translate the screen UP and slightly LEFT to
  // put the input bar at viewport center.
  const translateX = -40;
  const translateY = -250;

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
        <IdleScreen addressTyped={typed} showCursor={showCursor} />
      </div>
    </AbsoluteFill>
  );
};
