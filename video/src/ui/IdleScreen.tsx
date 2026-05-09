import { theme } from "../theme";
import { GridBG } from "./GridBG";
import { HeaderChrome } from "./HeaderChrome";
import { demoProperty } from "../data/demo-property";

// Mirrors components/roof-recon/IdleScreen.tsx — same layout, same headline,
// same input bar, same try-chips, same capability ticker.
// Pure rendering — no state, no event handlers (the typing animation lives
// in Shot03_MacroTyping which feeds `addressTyped` here as a prop).

type Props = {
  addressTyped: string; // current characters typed so far
  showCursor: boolean;
  buttonScale?: number; // 1.0 default; shot 4 animates this
  buttonGlow?: number; // 0..1 for the click ripple
};

const QUICK_ADDRESSES = [
  "21106 Kenswick Meadows Ct, Humble, TX 77338",
  "5914 Copper Lilly Lane, Spring, TX 77389",
  "122 NW 13th Ave, Cape Coral, FL 33993",
  "14132 Trenton Ave, Orland Park, IL 60462",
  "835 S Cobble Creek, Nixa, MO 65714",
];

export const IdleScreen: React.FC<Props> = ({
  addressTyped,
  showCursor,
  buttonScale = 1,
  buttonGlow = 0,
}) => {
  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: theme.bg,
        height: "100%",
      }}
    >
      <HeaderChrome />
      <GridBG />

      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 48px",
          zIndex: 2,
        }}
      >
        {/* Step label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 56,
            fontSize: 13,
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            letterSpacing: "0.3em",
            color: theme.textSoft,
          }}
        >
          <span style={{ width: 56, height: 1, background: theme.border }} />
          <span>STEP&nbsp;01&nbsp;//&nbsp;TARGET&nbsp;ACQUISITION</span>
          <span style={{ width: 56, height: 1, background: theme.border }} />
        </div>

        {/* Hero headline */}
        <h1
          style={{
            margin: 0,
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: 92,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            color: theme.text,
          }}
        >
          Measure any roof
          <br />
          <span style={{ fontWeight: 300, fontStyle: "italic", color: theme.blue }}>
            from{" "}
          </span>
          <span style={{ position: "relative", display: "inline-block" }}>
            <span
              style={{
                fontWeight: 800,
                fontStyle: "normal",
                color: theme.accent,
              }}
            >
              orbit.
            </span>
            <svg
              style={{
                position: "absolute",
                left: 0,
                bottom: -6,
                width: "100%",
                height: 8,
              }}
              viewBox="0 0 200 8"
              preserveAspectRatio="none"
            >
              <path
                d="M2 5 Q 100 1, 198 5"
                stroke={theme.accent}
                strokeWidth="2.5"
                fill="none"
              />
            </svg>
          </span>
        </h1>

        <p
          style={{
            marginTop: 28,
            maxWidth: 640,
            textAlign: "center",
            color: theme.textMuted,
            fontFamily: "Inter, sans-serif",
            fontSize: 18,
            lineHeight: 1.55,
          }}
        >
          Drop an address. Our AI pulls satellite imagery, traces every gable, ridge,
          and valley, then returns square footage and a priced estimate in under 60
          seconds.
        </p>

        {/* Address input */}
        <div
          style={{
            position: "relative",
            marginTop: 56,
            width: "100%",
            maxWidth: 760,
          }}
        >
          {/* Corner brackets */}
          <CornerBrackets />

          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              border: `1px solid ${theme.border}`,
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(6px)",
            }}
          >
            {/* Pin icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: 22,
                paddingRight: 16,
                borderRight: `1px solid ${theme.borderSoft}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, monospace",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    color: theme.textSoft,
                  }}
                >
                  ADDR
                </span>
                <svg
                  viewBox="0 0 24 24"
                  width={20}
                  height={20}
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth={1.6}
                >
                  <circle cx="12" cy="10" r="3" />
                  <path d="M12 2 C 7 2 4 5 4 10 c 0 6 8 12 8 12 s 8 -6 8 -12 c 0 -5 -3 -8 -8 -8 z" />
                </svg>
              </div>
            </div>

            {/* Input "field" — renders the typed address with a blinking cursor */}
            <div
              style={{
                flex: 1,
                padding: "22px 22px",
                fontFamily: "Inter, sans-serif",
                fontSize: 22,
                fontWeight: 500,
                color: theme.text,
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
              }}
            >
              {addressTyped.length > 0 ? (
                <>
                  {addressTyped}
                  {showCursor && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 22,
                        background: theme.accent,
                        marginLeft: 2,
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                </>
              ) : (
                <span style={{ color: theme.textFaint, fontWeight: 400 }}>
                  Enter property address…
                  {showCursor && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 22,
                        background: theme.accent,
                        marginLeft: 2,
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                </span>
              )}
            </div>

            {/* Scan roof button */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 30px",
                background: theme.accent,
                color: theme.accentInk,
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 18,
                letterSpacing: "-0.01em",
                transform: `scale(${buttonScale})`,
                transformOrigin: "center",
                boxShadow:
                  buttonGlow > 0
                    ? `0 0 ${24 * buttonGlow}px rgba(255,107,43,${0.6 * buttonGlow})`
                    : "none",
              }}
            >
              {/* Click ripple */}
              {buttonGlow > 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 0,
                    border: `2px solid ${theme.accent}`,
                    opacity: 1 - buttonGlow,
                    transform: `scale(${1 + buttonGlow * 0.4})`,
                    pointerEvents: "none",
                  }}
                />
              )}
              <span>Scan roof</span>
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontSize: 14,
                  opacity: 0.7,
                }}
              >
                →
              </span>
            </div>
          </div>

          {/* Quick-fill addresses */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              marginTop: 18,
              fontSize: 12,
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
            }}
          >
            <span style={{ letterSpacing: "0.18em", color: theme.textSoft }}>TRY:</span>
            {QUICK_ADDRESSES.map((s) => (
              <span
                key={s}
                style={{
                  padding: "4px 8px",
                  border: `1px solid ${theme.borderSoft}`,
                  color: theme.textMuted,
                  opacity: 0.85,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Capability ticker */}
        <div
          style={{
            marginTop: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 14,
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 13,
            letterSpacing: "0.25em",
            color: theme.textSoft,
          }}
        >
          <Capability num="01" label="PIXEL-PERFECT" />
          <span style={{ color: theme.borderSoft }}>·</span>
          <Capability num="02" label="PITCH-AWARE" />
          <span style={{ color: theme.borderSoft }}>·</span>
          <Capability num="03" label="ESTIMATE-READY" />
        </div>
      </div>
    </div>
  );
};

const Capability: React.FC<{ num: string; label: string }> = ({ num, label }) => (
  <span style={{ display: "inline-flex", gap: 10 }}>
    <span style={{ color: theme.accent }}>{num}</span>
    <span style={{ color: theme.text }}>{label}</span>
  </span>
);

const CornerBrackets: React.FC = () => {
  const positions = [
    { top: -1, left: -1, borderTop: 1, borderLeft: 1 },
    { top: -1, right: -1, borderTop: 1, borderRight: 1 },
    { bottom: -1, left: -1, borderBottom: 1, borderLeft: 1 },
    { bottom: -1, right: -1, borderBottom: 1, borderRight: 1 },
  ];
  return (
    <>
      {positions.map((pos, i) => {
        const { borderTop, borderRight, borderBottom, borderLeft, ...placement } = pos;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              borderTop: borderTop ? `1.5px solid ${theme.accent}` : undefined,
              borderRight: borderRight ? `1.5px solid ${theme.accent}` : undefined,
              borderBottom: borderBottom ? `1.5px solid ${theme.accent}` : undefined,
              borderLeft: borderLeft ? `1.5px solid ${theme.accent}` : undefined,
              ...placement,
            }}
          />
        );
      })}
    </>
  );
};
