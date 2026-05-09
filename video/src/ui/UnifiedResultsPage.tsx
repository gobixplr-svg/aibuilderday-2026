import { interpolate, Easing } from "remotion";
import { theme } from "../theme";
import { GridBG } from "./GridBG";
import { HeaderChrome } from "./HeaderChrome";
import { AerialFrame } from "./AerialFrame";
import { ConditionCardExpanded } from "./ConditionCardExpanded";
import { demoProperty, tiers } from "../data/demo-property";

// Single continuous "results page" used by shots 7-10. Camera scrolls/zooms
// through this one composition rather than cutting between separate scenes.
//
// Native page dimensions: 1920 wide × 2300 tall
// The shot wraps this in a transform (scale + translateY) to control what's
// visible at any given moment.
//
// The page is rendered as a vertical stack with FIXED Y positions so camera
// translateY values are predictable.

type Props = {
  // Frame counter starting at 0 from the start of the post-results phase
  // (i.e., the start of Shot 7). Drives all internal animations.
  phaseFrame: number;
};

// Frame thresholds for animations (relative to phaseFrame = 0 at start of Shot 7)
// Shot timings within post-results phase (in frames at 30fps):
//   Shot 7 (Hero zoom):      0–120   (0.0–4.0s)
//   Shot 8 (Stats):          120–180 (4.0–6.0s)
//   Shot 9 (Observations):   180–360 (6.0–12.0s)
//   Shot 10 (Pricing):       360–450 (12.0–15.0s)
//   Shot 11 (PDF reveal):    450–480
//   Shot 12 (PDF hold):      480–630

// Hero number odometer: counts 0 → 2081 over frames 30..70 of phase
const HERO_COUNT_START = 30;
const HERO_COUNT_END = 70;

// Stats stagger-fade: each stat appears with a 0.3s offset starting at frame 130
const STAT_APPEAR = [130, 138, 146]; // PITCH, CONFIDENCE, FOOTPRINT
const STAT_FADE_DURATION = 18; // 0.6s slide-up + fade

// Observations: appear with stagger inside ConditionCardExpanded
// (component takes shotFrame; we pass phaseFrame - 180 to time within Shot 9)

export const UnifiedResultsPage: React.FC<Props> = ({ phaseFrame }) => {
  // Hero number odometer
  const heroNumber = interpolate(
    phaseFrame,
    [HERO_COUNT_START, HERO_COUNT_END],
    [0, demoProperty.totalRoofSqFt],
    {
      easing: Easing.bezier(0.0, 0.0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Reticle lock animation (around frame 50–70)
  const reticleAppearance = interpolate(phaseFrame, [50, 70], [1.5, 1.0], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        width: 1920,
        height: 2300,
        background: theme.bg,
        overflow: "hidden",
      }}
    >
      <GridBG />

      {/* HEADER CHROME (~0–80px) */}
      <HeaderChrome
        status={{ dot: theme.success, label: "SCAN COMPLETE" }}
      />

      <div
        style={{
          position: "relative",
          padding: "24px 64px 40px",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* SCAN COMPLETE bar (~80–130px) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 14,
            color: theme.textSoft,
            letterSpacing: "0.18em",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 9,
                height: 9,
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

        {/* HERO + AERIAL ROW — side-by-side (v2 layout) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 48,
            alignItems: "start",
          }}
        >
          {/* Hero number block */}
          <div style={{ position: "relative", padding: "20px 24px" }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 22,
                height: 22,
                borderTop: `3px solid ${theme.accent}`,
                borderLeft: `3px solid ${theme.accent}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 22,
                height: 22,
                borderBottom: `3px solid ${theme.accent}`,
                borderLeft: `3px solid ${theme.accent}`,
              }}
            />
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: 13,
                letterSpacing: "0.32em",
                color: theme.textSoft,
                marginBottom: 8,
              }}
            >
              TOTAL ROOF AREA
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 200,
                  fontWeight: 900,
                  color: theme.text,
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(heroNumber).toLocaleString()}
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 40,
                  color: theme.textMuted,
                  fontWeight: 400,
                }}
              >
                sq ft
              </div>
            </div>
          </div>

          {/* Aerial inset with reticle */}
          <div style={{ position: "relative", height: 380 }}>
            <AerialFrame
              showReticleLock
              reticleAppearance={reticleAppearance}
              showSourceOverlay={false}
            />
            <div
              style={{
                position: "absolute",
                bottom: -22,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: 11,
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

        {/* STATS ROW (~620–800px) — animated stagger-fade */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
            paddingTop: 28,
            marginTop: 8,
          }}
        >
          <AnimatedStat
            label="PITCH"
            value={demoProperty.pitch}
            sub="roof slope"
            appearAt={STAT_APPEAR[0]}
            phaseFrame={phaseFrame}
          />
          <AnimatedStat
            label="CONFIDENCE"
            value={`${demoProperty.confidencePct}%`}
            sub="AI estimate"
            appearAt={STAT_APPEAR[1]}
            phaseFrame={phaseFrame}
            countUpFrom={0}
            countUpTo={demoProperty.confidencePct}
            countSuffix="%"
          />
          <AnimatedStat
            label="FOOTPRINT"
            value={demoProperty.footprintSqFt.toLocaleString()}
            sub="sq ft base"
            appearAt={STAT_APPEAR[2]}
            phaseFrame={phaseFrame}
            countUpFrom={0}
            countUpTo={demoProperty.footprintSqFt}
          />
        </div>

        {/* PRE-INSPECTION OBSERVATIONS section (~830–1380px) */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: 13,
              letterSpacing: "0.3em",
              color: theme.textSoft,
              marginBottom: 8,
            }}
          >
            PRE-INSPECTION OBSERVATIONS
          </div>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 38,
              fontWeight: 800,
              color: theme.text,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            AI vision report
          </div>
          {/* Pass shot-local frame (phaseFrame - 180 = local to Shot 9 start) */}
          <ConditionCardExpanded shotFrame={phaseFrame - 180} />
        </div>

        {/* ESTIMATE TIERS section (~1420–2300px) */}
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontSize: 12,
                  letterSpacing: "0.32em",
                  color: theme.textSoft,
                  marginBottom: 6,
                }}
              >
                ESTIMATE TIERS
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 42,
                  fontWeight: 800,
                  color: theme.text,
                  letterSpacing: "-0.02em",
                }}
              >
                Three options. One roof.
              </div>
            </div>
            <DownloadPdfButton phaseFrame={phaseFrame} />
          </div>

          {/* Stacked tier rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {tiers.map((tier, idx) => (
              <TierRow key={tier.label} tier={tier} index={idx} />
            ))}
          </div>

          {/* Footer note */}
          <div
            style={{
              marginTop: 24,
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: 11,
              letterSpacing: "0.25em",
              color: theme.textFaint,
            }}
          >
            ESTIMATE VALID 30 DAYS · LOCAL LABOR RATES APPLIED
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const AnimatedStat: React.FC<{
  label: string;
  value: string;
  sub: string;
  appearAt: number;
  phaseFrame: number;
  countUpFrom?: number;
  countUpTo?: number;
  countSuffix?: string;
}> = ({
  label,
  value,
  sub,
  appearAt,
  phaseFrame,
  countUpFrom,
  countUpTo,
  countSuffix,
}) => {
  const localFrame = phaseFrame - appearAt;
  const opacity = interpolate(localFrame, [0, STAT_FADE_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(
    localFrame,
    [0, STAT_FADE_DURATION],
    [16, 0],
    {
      easing: Easing.bezier(0.0, 0.0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Optional count-up for numeric stats
  let displayValue = value;
  if (countUpFrom !== undefined && countUpTo !== undefined) {
    const counted = interpolate(
      localFrame,
      [0, STAT_FADE_DURATION + 6],
      [countUpFrom, countUpTo],
      {
        easing: Easing.bezier(0.0, 0.0, 0.2, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
    displayValue = `${Math.round(counted).toLocaleString()}${countSuffix ?? ""}`;
  }

  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)` }}>
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          fontSize: 12,
          letterSpacing: "0.32em",
          color: theme.textSoft,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 56,
          fontWeight: 800,
          color: theme.text,
          marginTop: 4,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {displayValue}
      </div>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          color: theme.textSoft,
          marginTop: 4,
        }}
      >
        {sub}
      </div>
    </div>
  );
};

const DownloadPdfButton: React.FC<{ phaseFrame: number }> = ({ phaseFrame }) => {
  // Apple-style click animation, identical pattern to the Scan roof button at
  // the start of the spot. The click fires AFTER the camera has zoomed in on
  // the button (so the user sees a big, hero-sized click), not while the
  // camera is still wide.
  //
  // Click happens at Shot 10 frame 75-90 = phaseFrame 405-420 (after Shot 9
  // was trimmed; Shot 10's offset shifted to 330).
  //   phase 405-408: compress 1.0 → 0.96
  //   phase 408-411: bounce  0.96 → 1.05
  //   phase 411-415: settle  1.05 → 1.0
  //   phase 405-425: glow ripple expands and fades
  let buttonScale = 1;
  if (phaseFrame >= 405 && phaseFrame < 408) {
    buttonScale = interpolate(phaseFrame, [405, 408], [1.0, 0.96], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else if (phaseFrame >= 408 && phaseFrame < 411) {
    buttonScale = interpolate(phaseFrame, [408, 411], [0.96, 1.05], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else if (phaseFrame >= 411) {
    buttonScale = interpolate(phaseFrame, [411, 415], [1.05, 1.0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  // Glow + ripple expanding outward
  const buttonGlow = interpolate(phaseFrame, [405, 408, 425], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        background: theme.accent,
        color: theme.accentInk,
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        fontSize: 18,
        padding: "16px 26px",
        borderRadius: 5,
        display: "flex",
        alignItems: "center",
        gap: 12,
        transform: `scale(${buttonScale})`,
        boxShadow: buttonGlow > 0
          ? `0 0 ${30 * buttonGlow}px rgba(255,107,43,${0.55 * buttonGlow}), 0 1px 3px rgba(13,31,60,0.08)`
          : "0 1px 3px rgba(13,31,60,0.08)",
      }}
    >
      {/* Click ripple — expanding orange ring */}
      {buttonGlow > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: `2px solid ${theme.accent}`,
            borderRadius: 5,
            opacity: 1 - buttonGlow,
            transform: `scale(${1 + buttonGlow * 0.4})`,
            pointerEvents: "none",
          }}
        />
      )}
      <span style={{ fontSize: 15 }}>↓</span>
      <span>Download estimate PDF</span>
    </div>
  );
};

const TierRow: React.FC<{ tier: typeof tiers[0]; index: number }> = ({
  tier,
  index,
}) => {
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "minmax(260px, 1.1fr) 2fr 1fr",
        gap: 28,
        padding: "20px 24px 20px 32px",
        background: tier.recommended ? "rgba(255,107,43,0.05)" : theme.panel,
        border: `1px solid ${tier.recommended ? "rgba(255,107,43,0.45)" : theme.borderSoft}`,
        borderRadius: 6,
        alignItems: "center",
      }}
    >
      {tier.recommended && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            background: theme.accent,
            borderTopLeftRadius: 6,
            borderBottomLeftRadius: 6,
          }}
        />
      )}
      <div>
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 11,
            letterSpacing: "0.32em",
            color: tier.recommended ? theme.accent : theme.textSoft,
            marginBottom: 4,
            fontWeight: tier.recommended ? 700 : 400,
          }}
        >
          {tier.recommended
            ? `OPTION 0${index + 1} · RECOMMENDED`
            : `OPTION 0${index + 1}`}
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 26,
            fontWeight: 700,
            color: theme.text,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
          }}
        >
          {tier.name}
        </div>
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 10,
            color: theme.textSoft,
            letterSpacing: "0.22em",
            marginTop: 6,
          }}
        >
          {tier.warranty}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontFamily: "Inter, sans-serif",
          fontSize: 15,
          color: theme.text,
        }}
      >
        {tier.bullets.map((b, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "baseline", gap: 10 }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 1,
                background: tier.recommended ? theme.accent : theme.blue,
                display: "inline-block",
                flexShrink: 0,
                marginTop: 7,
              }}
            />
            <span>{b}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 42,
            fontWeight: 800,
            color: theme.text,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontWeight: 400,
              color: theme.textMuted,
              fontSize: 24,
              marginRight: 4,
            }}
          >
            $
          </span>
          {tier.total.toLocaleString()}
        </div>
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 11,
            color: theme.textSoft,
            marginTop: 4,
            letterSpacing: "0.1em",
          }}
        >
          ${tier.perSqFt.toFixed(2)} / SQ FT
        </div>
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 11,
            color: theme.textSoft,
            letterSpacing: "0.1em",
          }}
        >
          {demoProperty.totalRoofSqFt.toLocaleString()} SQ FT
        </div>
      </div>
    </div>
  );
};
