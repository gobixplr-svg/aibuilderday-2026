import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { authoredObservations, demoProperty } from "../data/demo-property";
import { ObservationItem } from "./ObservationItem";

// Expanded condition card with observations populating one-by-one
// Used in Shot 9 — counter ticks 0 → 1 → 2 → 3 as observations land

type Props = {
  // Local frame within Shot 9 (0 ... 90 frames)
  // Determines which observations are visible + counter value
  shotFrame: number;
};

// Stagger: observation N appears at frame appearAt[N]
// 0–6: empty
// 9: obs 1 appears
// 27: obs 2 appears
// 45: obs 3 appears
// 65: all rendered + counter at 3
const APPEAR_AT = [9, 27, 45];

export const ConditionCardExpanded: React.FC<Props> = ({ shotFrame }) => {
  // Counter value
  let visibleCount = 0;
  if (shotFrame >= APPEAR_AT[0]) visibleCount = 1;
  if (shotFrame >= APPEAR_AT[1]) visibleCount = 2;
  if (shotFrame >= APPEAR_AT[2]) visibleCount = 3;

  // Subtle 1.0 → 1.005 breathing
  const breath = 1.0 + Math.sin((shotFrame / 90) * Math.PI) * 0.005;

  return (
    <div
      style={{
        border: `1px solid ${theme.borderSoft}`,
        borderRadius: 6,
        background: theme.panel,
        transform: `scale(${breath})`,
        transformOrigin: "center center",
        boxShadow: "0 2px 14px rgba(13,31,60,0.04)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "14px 16px",
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          fontSize: 12,
          letterSpacing: "0.25em",
          color: theme.textSoft,
          alignItems: "center",
        }}
      >
        <span>
          CONDITION{" "}
          <span style={{ color: theme.success, fontWeight: 700 }}>
            {demoProperty.condition}
          </span>
        </span>
        <span
          style={{
            fontVariantNumeric: "tabular-nums",
            color: visibleCount > 0 ? theme.text : theme.textSoft,
            fontWeight: visibleCount > 0 ? 700 : 400,
          }}
        >
          {visibleCount} OBSERVATIONS
        </span>
      </div>

      {/* Observations */}
      {authoredObservations.map((obs, idx) => (
        <ObservationItem
          key={obs.id}
          observation={obs}
          appearAtFrame={APPEAR_AT[idx]}
          currentFrame={shotFrame}
        />
      ))}

      {/* Footer */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: `1px solid ${theme.borderSoft}`,
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          fontSize: 9,
          letterSpacing: "0.25em",
          color: theme.textFaint,
        }}
      >
        AI VISION CONDITION ASSESSMENT · PRE-INSPECTION ONLY · NOT A DIAGNOSIS
      </div>
    </div>
  );
};
