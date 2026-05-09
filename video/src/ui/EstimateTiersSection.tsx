import { theme } from "../theme";
import { tiers, demoProperty } from "../data/demo-property";

// Shot 10 framing — matches reference/pdfbuttonpreview.png:
// - "ESTIMATE TIERS / Three options. One roof." heading + orange "Download estimate PDF" CTA top-right
// - 3 stacked tier cards (Standard / Premium-RECOMMENDED / Luxury)
// - Premium has orange-bracket left highlight
// - Bottom small text: ESTIMATE VALID 30 DAYS · LOCAL LABOR RATES APPLIED

type Props = {
  // 0..1 button click animation state
  buttonScale?: number;
  buttonGlow?: number;
  // Cursor position relative to the section (rendered above as overlay)
  // Optional — caller (Shot10) overlays a Cursor component at the right coords
};

export const EstimateTiersSection: React.FC<Props> = ({
  buttonScale = 1,
  buttonGlow = 0,
}) => {
  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        background: theme.bg,
        padding: "48px 64px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Heading + CTA row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: 11,
              letterSpacing: "0.3em",
              color: theme.textSoft,
              marginBottom: 6,
            }}
          >
            ESTIMATE TIERS
          </div>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 38,
              fontWeight: 800,
              color: theme.text,
              letterSpacing: "-0.02em",
            }}
          >
            Three options. One roof.
          </div>
        </div>

        {/* Orange Download PDF button */}
        <div
          style={{
            position: "relative",
            background: theme.accent,
            color: theme.accentInk,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 17,
            padding: "14px 22px",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 10,
            transform: `scale(${buttonScale})`,
            transformOrigin: "center",
            boxShadow:
              buttonGlow > 0
                ? `0 0 ${28 * buttonGlow}px rgba(255,107,43,${0.6 * buttonGlow})`
                : "0 1px 3px rgba(13,31,60,0.08)",
            transition: "box-shadow 0.05s",
          }}
        >
          {buttonGlow > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                border: `2px solid ${theme.accent}`,
                opacity: 1 - buttonGlow,
                transform: `scale(${1 + buttonGlow * 0.3})`,
                pointerEvents: "none",
              }}
            />
          )}
          <span style={{ fontSize: 14 }}>↓</span>
          <span>Download estimate PDF</span>
        </div>
      </div>

      {/* Stacked tier cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {tiers.map((tier, idx) => (
          <TierRow key={tier.label} tier={tier} index={idx} />
        ))}
      </div>

      {/* Bottom footnote */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 20,
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          fontSize: 10,
          letterSpacing: "0.25em",
          color: theme.textFaint,
        }}
      >
        ESTIMATE VALID 30 DAYS · LOCAL LABOR RATES APPLIED
      </div>
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
        gridTemplateColumns: "minmax(220px, 1.1fr) 2fr 1fr",
        gap: 24,
        padding: "16px 20px 16px 28px",
        background: tier.recommended ? "rgba(255,107,43,0.04)" : theme.panel,
        border: `1px solid ${tier.recommended ? "rgba(255,107,43,0.4)" : theme.borderSoft}`,
        borderRadius: 6,
        alignItems: "center",
      }}
    >
      {/* Orange left bracket on recommended */}
      {tier.recommended && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: theme.accent,
            borderTopLeftRadius: 6,
            borderBottomLeftRadius: 6,
          }}
        />
      )}

      {/* Left: option label + tier name */}
      <div>
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 10,
            letterSpacing: "0.3em",
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
            fontSize: 22,
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
            fontSize: 9,
            color: theme.textSoft,
            letterSpacing: "0.2em",
            marginTop: 6,
          }}
        >
          {tier.warranty}
        </div>
      </div>

      {/* Middle: bullet items */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          color: theme.text,
        }}
      >
        {tier.bullets.map((b, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "baseline", gap: 8 }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 1,
                background: tier.recommended ? theme.accent : theme.blue,
                display: "inline-block",
                flexShrink: 0,
                marginTop: 6,
              }}
            />
            <span>{b}</span>
          </div>
        ))}
      </div>

      {/* Right: total + per sqft + sqft */}
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 36,
            fontWeight: 800,
            color: theme.text,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ fontWeight: 400, color: theme.textMuted, fontSize: 22, marginRight: 4 }}>
            $
          </span>
          {tier.total.toLocaleString()}
        </div>
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 10,
            color: theme.textSoft,
            marginTop: 2,
            letterSpacing: "0.1em",
          }}
        >
          ${tier.perSqFt.toFixed(2)} / SQ FT
        </div>
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 10,
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
