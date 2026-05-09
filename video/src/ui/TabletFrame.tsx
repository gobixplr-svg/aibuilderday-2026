import { theme } from "../theme";

// iPad-style chrome: rounded bezel, slim border, drop shadow.
// The screen content (children) renders inside the bezel.

type Props = {
  width: number;
  height: number;
  children: React.ReactNode;
  // Allow callers to disable shadow (for close-up shots where shadow would clip)
  shadow?: boolean;
};

export const TabletFrame: React.FC<Props> = ({
  width,
  height,
  children,
  shadow = true,
}) => {
  // Bezel padding scales with size
  const bezel = Math.round(width * 0.018);
  const radius = Math.round(width * 0.025);
  return (
    <div
      style={{
        width,
        height,
        background: "#0a0a0a",
        borderRadius: radius,
        padding: bezel,
        boxShadow: shadow
          ? `0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`
          : "none",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: theme.bg,
          borderRadius: radius - bezel,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
};
