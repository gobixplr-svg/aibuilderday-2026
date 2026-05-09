import { theme } from "../theme";
import { GridBG } from "./GridBG";
import { HeaderChrome } from "./HeaderChrome";
import { AerialFrame } from "./AerialFrame";
import { demoProperty } from "../data/demo-property";

// Split layout: aerial-frame left, status panel right.
// All animation state passed as props so the shot components own the timing.

type Props = {
  elapsedSeconds: number; // displayed timer (e.g. 17 → "00:17")
  currentOpIndex: number; // 0..processingOps.length-1
  pipelineActiveIdx: number; // first incomplete item is "active"; items < this are completed
  progressPct: number; // 0..100
  scanProgress: number; // 0..1, pass-through to AerialFrame
};

export const ProcessingScreen: React.FC<Props> = ({
  elapsedSeconds,
  currentOpIndex,
  pipelineActiveIdx,
  progressPct,
  scanProgress,
}) => {
  const mm = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
  const ss = Math.floor(elapsedSeconds % 60).toString().padStart(2, "0");
  const op = demoProperty.processingOps[
    Math.min(currentOpIndex, demoProperty.processingOps.length - 1)
  ];

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
          padding: "24px 48px 48px",
          zIndex: 2,
        }}
      >
        {/* Recon buffer label */}
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 11,
            letterSpacing: "0.25em",
            color: theme.textSoft,
            marginBottom: 12,
          }}
        >
          RECON BUFFER // 3561 E 102ND CT
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
            height: "calc(100% - 40px)",
          }}
        >
          {/* LEFT: aerial frame */}
          <AerialFrame scanProgress={scanProgress} />

          {/* RIGHT: status panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              paddingTop: 8,
            }}
          >
            {/* Big timer */}
            <div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 96,
                  fontWeight: 700,
                  color: theme.text,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {mm}
                <span style={{ color: theme.accent }}>:{ss}</span>
              </div>
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  color: theme.textSoft,
                  marginTop: 4,
                }}
              >
                ELAPSED LIVE RUN
              </div>
            </div>

            {/* Current operation */}
            <div>
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  color: theme.textSoft,
                  marginBottom: 4,
                }}
              >
                CURRENT OPERATION
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 22,
                  fontWeight: 600,
                  color: theme.text,
                }}
              >
                {op}
                <span style={{ color: theme.accent }}>▌</span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  color: theme.textSoft,
                  marginBottom: 6,
                }}
              >
                <span>PIPELINE</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div
                style={{
                  height: 5,
                  background: "rgba(13,31,60,0.08)",
                  borderRadius: 2,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progressPct}%`,
                    background: theme.accent,
                    borderRadius: 2,
                    transition: "width 0.05s linear",
                  }}
                />
              </div>
            </div>

            {/* Pipeline checklist */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: 14,
                marginTop: 4,
              }}
            >
              {demoProperty.pipelineSteps.map((step, idx) => {
                const completed = idx < pipelineActiveIdx;
                const active = idx === pipelineActiveIdx;
                return (
                  <div
                    key={step}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: completed
                        ? theme.textDim
                        : active
                          ? theme.text
                          : theme.textDim,
                      textDecoration: completed ? "line-through" : "none",
                    }}
                  >
                    <span style={{ fontSize: 12, color: completed ? theme.textDim : active ? theme.accent : theme.textFaint }}>
                      {completed ? "✓" : active ? "●" : "○"}
                    </span>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>

            {/* Abort scan */}
            <div
              style={{
                marginTop: "auto",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: 11,
                letterSpacing: "0.25em",
                color: theme.textSoft,
              }}
            >
              ← ABORT SCAN
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
