// macOS-style cursor — white fill with thin black stroke + drop shadow
// SVG so it stays crisp at any scale
type Props = {
  x: number;
  y: number;
  scale?: number;
};

export const Cursor: React.FC<Props> = ({ x, y, scale = 1 }) => {
  return (
    <svg
      width={28 * scale}
      height={32 * scale}
      viewBox="0 0 28 32"
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
      }}
    >
      <path
        d="M3 2 L3 24 L9 18 L13 28 L17 26 L13 17 L21 17 Z"
        fill="white"
        stroke="black"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
};
