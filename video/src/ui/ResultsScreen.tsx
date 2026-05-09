import { theme } from "../theme";
import { GridBG } from "./GridBG";
import { HeaderChrome } from "./HeaderChrome";
import { AerialFrame } from "./AerialFrame";
import { demoProperty } from "../data/demo-property";

// Final state: top status bar + hero number + stats + condition + reticled aerial + tier card.
// All entrance animations driven by props from the shot components.

type Props = {
  heroNumberDisplay: number; // animated 0 -> 2081
  showStats?: boolean; // shot 9 stagger
  showCondition?: boolean;
  showTierCard?: boolean;
  reticleAppearance?: number; // 1.5 -> 1.0 lock animation
  headerGlow?: boolean;
};

export const ResultsScreen: React.FC<Props> = ({
  heroNumberDisplay,
  showStats = false,
  showCondition = false,
  showTierCard = false,
  reticleAppearance = 1,
  headerGlow = false,
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
      <HeaderChrome
        status={{ dot: theme.success, label: "SCAN COMPLETE" }}
        glow={headerGlow}
      />
      <GridBG />

      <div
        style={{
          position: "relative",
          flex: 1,
          padding: "24px 48px 32px",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Top metadata bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 12,
            color: theme.textSoft,
            letterSpacing: "0.18em",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: theme.success,
                boxShadow: `0 0 8px ${theme.success}`,
              }}
            />
            <span style={{ color: theme.success, fontWeight: 700 }}>SCAN COMPLETE</span>
          </span>
          <span>{demoProperty.reportId}</span>
          <span>{demoProperty.address}</span>
          <span style={{ marginLeft: "auto" }}>⤴ NEW SCAN</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.25fr 1fr",
            gap: 36,
            flex: 1,
          }}
        >
          {/* LEFT: hero number + stats + condition */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Hero number */}
            <div style={{ position: "relative", padding: "18px 20px" }}>
              {/* Corner brackets */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 16,
                  height: 16,
                  borderTop: `2px solid ${theme.accent}`,
                  borderLeft: `2px solid ${theme.accent}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: 16,
                  height: 16,
                  borderBottom: `2px solid ${theme.accent}`,
                  borderLeft: `2px solid ${theme.accent}`,
                }}
              />
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  color: theme.textSoft,
                  marginBottom: 4,
                }}
              >
                TOTAL ROOF AREA
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 152,
                    fontWeight: 900,
                    color: theme.text,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {Math.round(heroNumberDisplay).toLocaleString()}
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 32,
                    color: theme.textMuted,
                    fontWeight: 400,
                  }}
                >
                  sq ft
                </div>
              </div>
            </div>

            {/* Stats row */}
            {showStats && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 18,
                  paddingLeft: 20,
                }}
              >
                <Stat label="PITCH" value={demoProperty.pitch} sub="roof slope" />
                <Stat
                  label="CONFIDENCE"
                  value={`${demoProperty.confidencePct}%`}
                  sub="AI estimate"
                />
                <Stat
                  label="FOOTPRINT"
                  value={demoProperty.footprintSqFt.toLocaleString()}
                  sub="sq ft base"
                />
              </div>
            )}

            {/* Condition card */}
            {showCondition && (
              <div
                style={{
                  border: `1px solid ${theme.borderSoft}`,
                  borderRadius: 4,
                  padding: "12px 16px",
                  background: theme.panel,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "ui-monospace, SFMono-Regular, monospace",
                    fontSize: 11,
                    letterSpacing: "0.25em",
                    color: theme.textSoft,
                    marginBottom: 6,
                  }}
                >
                  <span>
                    CONDITION{" "}
                    <span style={{ color: theme.success, fontWeight: 700 }}>
                      {demoProperty.condition}
                    </span>
                  </span>
                  <span>{demoProperty.observations} OBSERVATIONS</span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: theme.text,
                    lineHeight: 1.5,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {demoProperty.conditionNote}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: aerial with reticle + footer */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
              <AerialFrame
                showReticleLock
                reticleAppearance={reticleAppearance}
                showSourceOverlay={false}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: 10,
                letterSpacing: "0.25em",
                color: theme.textSoft,
              }}
            >
              <span>
                <span style={{ color: theme.accent }}>●</span> TARGET LOCKED
              </span>
              <span>{demoProperty.pixelsPerMeter.toFixed(2)}m/px</span>
            </div>
          </div>
        </div>

        {/* Tier card */}
        {showTierCard && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "14px 20px",
              borderTop: `1px solid ${theme.borderSoft}`,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  color: theme.textSoft,
                }}
              >
                ESTIMATE TIERS
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 26,
                  fontWeight: 800,
                  color: theme.text,
                  marginTop: 2,
                }}
              >
                Three options. One roof.
              </div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, monospace",
                    fontSize: 9,
                    letterSpacing: "0.25em",
                    color: theme.textSoft,
                  }}
                >
                  OPTION 01 / {demoProperty.standardTier.label.toUpperCase()}
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 36,
                    fontWeight: 800,
                    color: theme.text,
                    marginTop: 2,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ${demoProperty.standardTier.total.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  background: theme.accent,
                  color: theme.accentInk,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  padding: "10px 16px",
                  borderRadius: 4,
                }}
              >
                ↓ Download estimate PDF
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; sub: string }> = ({
  label,
  value,
  sub,
}) => (
  <div>
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        fontSize: 10,
        letterSpacing: "0.3em",
        color: theme.textSoft,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 36,
        fontWeight: 800,
        color: theme.text,
        marginTop: 2,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        color: theme.textSoft,
        marginTop: 1,
      }}
    >
      {sub}
    </div>
  </div>
);
