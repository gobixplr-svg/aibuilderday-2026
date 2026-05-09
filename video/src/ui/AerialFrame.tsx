import { staticFile } from "remotion";
import { theme } from "../theme";

// Aerial image with corner reticle brackets, source overlay, target-lock overlay.
// Mirrors components/roof-recon/SatelliteFrame.tsx feel.

type Props = {
  scanProgress?: number; // 0..1, position of horizontal scan line
  showReticleLock?: boolean; // when true, draw the locked-on reticle on subject
  reticleAppearance?: number; // 0..1 scale 1.5 -> 1.0
  showSourceOverlay?: boolean;
  width?: number;
  height?: number;
};

export const AerialFrame: React.FC<Props> = ({
  scanProgress,
  showReticleLock = false,
  reticleAppearance = 1,
  showSourceOverlay = true,
  width,
  height,
}) => {
  return (
    <div
      style={{
        position: "relative",
        width: width ?? "100%",
        height: height ?? "100%",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <img
        src={staticFile("aerial.jpg")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Source overlay (top-left) */}
      {showSourceOverlay && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.15em",
            lineHeight: 1.4,
          }}
        >
          <div>SOURCE: GOOGLE STATIC MAPS</div>
          <div>ZOOM 20 / 0.06m/px</div>
        </div>
      )}

      {/* Bottom-left: TILE LOCKED */}
      {showSourceOverlay && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 9,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.2em",
          }}
        >
          TILE LOCKED
        </div>
      )}

      {/* Bottom-right: ANALYZING IMAGERY */}
      {showSourceOverlay && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 9,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.2em",
          }}
        >
          ANALYZING IMAGERY
        </div>
      )}

      {/* Corner reticles */}
      <CornerReticle position="tl" />
      <CornerReticle position="tr" />
      <CornerReticle position="bl" />
      <CornerReticle position="br" />

      {/* Scan line */}
      {scanProgress !== undefined && scanProgress >= 0 && scanProgress <= 1 && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${scanProgress * 100}%`,
              height: 2,
              background: theme.accent,
              boxShadow: `0 0 18px ${theme.accent}, 0 0 6px ${theme.accent}`,
              pointerEvents: "none",
            }}
          />
          {/* Scan trail */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: `${scanProgress * 100}%`,
              background: `linear-gradient(180deg, transparent 0%, rgba(255,107,43,0.05) 100%)`,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* Reticle lock on subject home */}
      {showReticleLock && (
        <div
          style={{
            position: "absolute",
            top: "52%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${reticleAppearance})`,
          }}
        >
          {/* Outer ring */}
          <div
            style={{
              width: 90,
              height: 90,
              border: `2px solid ${theme.accent}`,
              borderRadius: "50%",
              boxShadow: `0 0 18px ${theme.accent}`,
              opacity: reticleAppearance > 0.4 ? 1 : 0,
            }}
          />
          {/* Crosshair lines */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 1.5,
              height: 50,
              background: theme.accent,
              transform: "translate(-50%,-50%) translateY(-60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 1.5,
              height: 50,
              background: theme.accent,
              transform: "translate(-50%,-50%) translateY(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 50,
              height: 1.5,
              background: theme.accent,
              transform: "translate(-50%,-50%) translateX(-60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 50,
              height: 1.5,
              background: theme.accent,
              transform: "translate(-50%,-50%) translateX(60px)",
            }}
          />
          {/* Center dot */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 6,
              height: 6,
              background: theme.accent,
              borderRadius: "50%",
              transform: "translate(-50%,-50%)",
            }}
          />
        </div>
      )}
    </div>
  );
};

const CornerReticle: React.FC<{ position: "tl" | "tr" | "bl" | "br" }> = ({
  position,
}) => {
  const size = 18;
  const offset = 8;
  const styles: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
  };
  switch (position) {
    case "tl":
      styles.top = offset;
      styles.left = offset;
      styles.borderTop = `2px solid ${theme.accent}`;
      styles.borderLeft = `2px solid ${theme.accent}`;
      break;
    case "tr":
      styles.top = offset;
      styles.right = offset;
      styles.borderTop = `2px solid ${theme.accent}`;
      styles.borderRight = `2px solid ${theme.accent}`;
      break;
    case "bl":
      styles.bottom = offset;
      styles.left = offset;
      styles.borderBottom = `2px solid ${theme.accent}`;
      styles.borderLeft = `2px solid ${theme.accent}`;
      break;
    case "br":
      styles.bottom = offset;
      styles.right = offset;
      styles.borderBottom = `2px solid ${theme.accent}`;
      styles.borderRight = `2px solid ${theme.accent}`;
      break;
  }
  return <div style={styles} />;
};
