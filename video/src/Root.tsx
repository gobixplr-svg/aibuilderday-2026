import { Composition } from "remotion";
import { Reveal15 } from "./Reveal15";
import { Reveal30 } from "./Reveal30";

const FPS = 30;

export const RemotionRoot = () => {
  return (
    <>
      {/* v2 — primary deliverable */}
      <Composition
        id="Reveal30"
        component={Reveal30}
        durationInFrames={1080}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* v1 — kept for reference */}
      <Composition
        id="Reveal15"
        component={Reveal15}
        durationInFrames={15 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
