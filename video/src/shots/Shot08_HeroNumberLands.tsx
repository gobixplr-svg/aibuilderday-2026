import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { ResultsScreen } from "../ui/ResultsScreen";
import { demoProperty } from "../data/demo-property";

// 10.0–13.0s · 90 frames · Hero number lands
// Frames 0–24 (0.0–0.8s): odometer counts 0 → 2,081 (with overshoot at end)
// Frames 24–60: number settles, reticle scales 1.5 → 1.0 with TARGET LOCKED feel
// Frames 60–90: hold + subtle 1.0 → 0.99 push-out as it settles

export const Shot08_HeroNumberLands: React.FC = () => {
  const frame = useCurrentFrame();

  // Odometer counter — eases out
  const heroNumber = interpolate(
    frame,
    [0, 24],
    [0, demoProperty.totalRoofSqFt],
    {
      easing: Easing.bezier(0.0, 0.0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Reticle scales 1.5 → 1.0 between frames 18 and 36 (lock animation)
  const reticleAppearance = interpolate(frame, [18, 36], [1.5, 1.0], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Camera zoomed in on the hero number area (upper-left of ResultsScreen)
  // Then pulls back very slightly as the number settles.
  // Reduced scale from 2.0 → 1.7 so the full "2,081" reads without cropping.
  const scale = interpolate(frame, [0, 24, 90], [1.7, 1.7, 1.65], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Translate so the hero number center (~x=435, y=363 in the rendered
  // ResultsScreen) lands at viewport center (960, 540).
  // Math: translateX = (960 - 435) = 525, translateY = (540 - 363) = 177.
  const translateX = 525;
  const translateY = 177;

  return (
    <AbsoluteFill style={{ background: "#F4F6FB", overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: "center center",
          display: "flex",
        }}
      >
        <ResultsScreen
          heroNumberDisplay={heroNumber}
          showStats={false}
          showCondition={false}
          showTierCard={false}
          reticleAppearance={reticleAppearance}
        />
      </div>
    </AbsoluteFill>
  );
};
