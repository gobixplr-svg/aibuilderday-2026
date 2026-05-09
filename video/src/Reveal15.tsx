import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { BackgroundFrame } from "./ui/BackgroundFrame";
import { Shot01_EstablishingPushIn } from "./shots/Shot01_EstablishingPushIn";
import { Shot02_HeadlineTilt } from "./shots/Shot02_HeadlineTilt";
import { Shot03_MacroTyping } from "./shots/Shot03_MacroTyping";
import { Shot04_PanCTAClick } from "./shots/Shot04_PanCTAClick";
import { Shot05_WhooshProcessing } from "./shots/Shot05_WhooshProcessing";
import { Shot06_ProcessingMontage } from "./shots/Shot06_ProcessingMontage";
import { Shot07_WhooshResults } from "./shots/Shot07_WhooshResults";
import { Shot08_HeroNumberLands } from "./shots/Shot08_HeroNumberLands";
import { Shot09_PullOutReveal } from "./shots/Shot09_PullOutReveal";

// Pre-load Inter so the typography is correct on the first frame
loadFont();

// 30 fps · 15 seconds · 450 frames total
// Frame ranges per shot (kept consistent with the plan)
export const SHOTS = {
  shot1: { from: 0, durationInFrames: 45 }, // 0.0–1.5s establishing + push-in
  shot2: { from: 45, durationInFrames: 30 }, // 1.5–2.5s headline + tilt
  shot3: { from: 75, durationInFrames: 90 }, // 2.5–5.5s macro typing
  shot4: { from: 165, durationInFrames: 30 }, // 5.5–6.5s pan to CTA + click
  shot5: { from: 195, durationInFrames: 15 }, // 6.5–7.0s whoosh into processing
  shot6: { from: 210, durationInFrames: 75 }, // 7.0–9.5s processing montage
  shot7: { from: 285, durationInFrames: 15 }, // 9.5–10.0s whoosh into results
  shot8: { from: 300, durationInFrames: 90 }, // 10.0–13.0s hero number lands
  shot9: { from: 390, durationInFrames: 60 }, // 13.0–15.0s pull-out reveal
};

export const Reveal15: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0D1F3C" }}>
      {/* Persistent dark navy gradient backdrop */}
      <BackgroundFrame />

      {/* Sequenced shots */}
      <Sequence {...SHOTS.shot1}>
        <Shot01_EstablishingPushIn />
      </Sequence>
      <Sequence {...SHOTS.shot2}>
        <Shot02_HeadlineTilt />
      </Sequence>
      <Sequence {...SHOTS.shot3}>
        <Shot03_MacroTyping />
      </Sequence>
      <Sequence {...SHOTS.shot4}>
        <Shot04_PanCTAClick />
      </Sequence>
      <Sequence {...SHOTS.shot5}>
        <Shot05_WhooshProcessing />
      </Sequence>
      <Sequence {...SHOTS.shot6}>
        <Shot06_ProcessingMontage />
      </Sequence>
      <Sequence {...SHOTS.shot7}>
        <Shot07_WhooshResults />
      </Sequence>
      <Sequence {...SHOTS.shot8}>
        <Shot08_HeroNumberLands />
      </Sequence>
      <Sequence {...SHOTS.shot9}>
        <Shot09_PullOutReveal />
      </Sequence>
    </AbsoluteFill>
  );
};

// Shared easing helpers
export const easeInOut = Easing.bezier(0.4, 0.0, 0.2, 1);
export const easeOut = Easing.bezier(0.0, 0.0, 0.2, 1);
export const easeIn = Easing.bezier(0.4, 0.0, 1, 1);

// Helper that crossfades opacity over the leading and trailing edges of a sequence
export const useShotOpacity = (frame: number, fadeFrames = 6, totalFrames = 30) => {
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [totalFrames - fadeFrames, totalFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return Math.min(fadeIn, fadeOut);
};
