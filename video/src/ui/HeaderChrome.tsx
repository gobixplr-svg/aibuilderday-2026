import { theme } from "../theme";

// Top bar: [icon] JOBNIMBUS / ROOF RECON ............ ● SAT LINK LIVE  v0.4.2 // HACKATHON
// Mirrors the live app's HeaderChrome.tsx layout.

type Props = {
  status?: { dot: string; label: string };
  glow?: boolean; // Shot 9 — header chrome glows briefly
};

export const HeaderChrome: React.FC<Props> = ({
  status = { dot: theme.success, label: "SAT LINK LIVE" },
  glow = false,
}) => {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
        borderBottom: `1px solid ${theme.borderSoft}`,
        background: glow
          ? `linear-gradient(180deg, rgba(255,107,43,0.06), transparent)`
          : "transparent",
        transition: "background 0.3s",
      }}
    >
      {/* Brand lockup */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: theme.accent,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          ⌂
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              color: theme.text,
              letterSpacing: "0.18em",
              fontSize: 14,
            }}
          >
            JOBNIMBUS
          </div>
          <div
            style={{
              fontFamily: "Inter, monospace",
              fontWeight: 500,
              color: theme.accent,
              letterSpacing: "0.28em",
              fontSize: 10,
            }}
          >
            ROOF RECON
          </div>
        </div>
      </div>

      {/* Right cluster */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          fontSize: 11,
          color: theme.textSoft,
          letterSpacing: "0.2em",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: status.dot,
              boxShadow: `0 0 8px ${status.dot}`,
            }}
          />
          {status.label}
        </span>
        <span>v0.4.2 // HACKATHON</span>
        <span
          style={{
            border: `1px solid ${theme.borderSoft}`,
            padding: "3px 8px",
            borderRadius: 3,
            fontSize: 10,
          }}
        >
          DBG
        </span>
      </div>
    </div>
  );
};
