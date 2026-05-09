import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { ResultsScreen } from "../ui/ResultsScreen";
import { TabletFrame } from "../ui/TabletFrame";
import { demoProperty } from "../data/demo-property";

// 13.0–15.0s · 60 frames · Pull-out reveal
// Frames 0–30: stay in close-up, then begin pulling back
// Frame 0–10: stats stagger in
// Frame 10–20: condition card fades in
// Frame 20–35: tier card slides up
// Frame 30–55: camera pulls back, full ResultsScreen visible inside the tablet bezel
// Frame 50–60: header chrome glows briefly + final hold

export const Shot09_PullOutReveal: React.FC = () => {
  const frame = useCurrentFrame();

  // Stagger entrance flags
  const showStats = frame >= 0;
  const showCondition = frame >= 10;
  const showTierCard = frame >= 20;

  // Camera pulls back: starts where Shot 8 ended (scale 1.95, translated)
  // Eventually settles into a full-frame view of the ResultsScreen wrapped in a tablet bezel.
  // Stage 1 (frames 0–30): pull from scale 1.95 down to 1.0, translate to 0,0
  const scale = interpolate(frame, [0, 35], [1.95, 1.0], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(frame, [0, 35], [250, 0], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 35], [180, 0], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tablet bezel comes back into view in stage 2 (frames 35–55)
  // Implemented by scaling DOWN the rendered screen to reveal a bezel border around it
  const bezelReveal = interpolate(frame, [35, 55], [0, 1], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Header glow fires in the last 0.3s (frames 51-60)
  const headerGlow = frame >= 51;

  // Reticle stays locked
  const reticleAppearance = 1;

  return (
    <AbsoluteFill style={{ background: "#0D1F3C", overflow: "hidden" }}>
      {/* Inner content scales + translates from close-up back to full-frame */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: "center center",
          display: "flex",
          position: "relative",
        }}
      >
        {/* When bezelReveal > 0, wrap in tablet frame for the final pull-out */}
        {bezelReveal > 0 ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${1 - bezelReveal * 0.18})`,
              transformOrigin: "center center",
            }}
          >
            <TabletFrame width={1920 * 0.95} height={1080 * 0.92}>
              <ResultsScreen
                heroNumberDisplay={demoProperty.totalRoofSqFt}
                showStats={showStats}
                showCondition={showCondition}
                showTierCard={showTierCard}
                reticleAppearance={reticleAppearance}
                headerGlow={headerGlow}
              />
            </TabletFrame>
          </div>
        ) : (
          <ResultsScreen
            heroNumberDisplay={demoProperty.totalRoofSqFt}
            showStats={showStats}
            showCondition={showCondition}
            showTierCard={showTierCard}
            reticleAppearance={reticleAppearance}
            headerGlow={headerGlow}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
