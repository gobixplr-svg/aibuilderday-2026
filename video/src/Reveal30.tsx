import { AbsoluteFill, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Shot01_HoldAndPushIn } from "./shots/Shot01_HoldAndPushIn";
import { Shot03_MacroTyping } from "./shots/Shot03_MacroTyping";
import { Shot04_PanCTAClick } from "./shots/Shot04_PanCTAClick";
import { Shot05_WhooshProcessing } from "./shots/Shot05_WhooshProcessing";
import { Shot06_ProcessingMontage } from "./shots/Shot06_ProcessingMontage";
import { Shot07_WhooshResults } from "./shots/Shot07_WhooshResults";
import { Shot07_ResultsHero } from "./shots/Shot07_ResultsHero";
import { Shot08_TiltToStats } from "./shots/Shot08_TiltToStats";
import { Shot09_ObservationsReveal } from "./shots/Shot09_ObservationsReveal";
import { Shot10_DownloadClick } from "./shots/Shot10_DownloadClick";
import { Shot11_PdfReveal } from "./shots/Shot11_PdfReveal";
import { Shot12_Outro } from "./shots/Shot12_Outro";

loadFont();

// 30 fps · 36.0 seconds · 1080 frames total (v3 + trimmed PDF + outro)
//
// v3 makes the post-results section ONE continuous scroll through a unified
// page rather than a series of discrete scenes. The user's complaint about v2
// was that the full-page glimpse → hero close-up was a hard cut and the stats
// pop-in was abrupt. v3 fixes both: smooth zoom-in on the hero with the number
// counting up, then continuous scroll through stats → observations → pricing →
// Download button.
//
// v3 # | v3 Time      | v3 file                        | Reveal30 frames
// -----|--------------|--------------------------------|----------------
// 1    | 0.0–4.0s     | Shot01_HoldAndPushIn           | 0..120
// 2    | 4.0–9.0s     | Shot03_MacroTyping             | 120..270
// 3    | 9.0–10.5s    | Shot04_PanCTAClick             | 270..315
// 4    | 10.5–11.0s   | Shot05_WhooshProcessing        | 315..330
// 5    | 11.0–14.5s   | Shot06_ProcessingMontage       | 330..435
// 6    | 14.5–15.0s   | Shot07_WhooshResults           | 435..450
// 7    | 15.0–19.0s   | Shot07_ResultsHero             | 450..570
// 8    | 19.0–21.0s   | Shot08_TiltToStats             | 570..630
// 9    | 21.0–25.5s   | Shot09_ObservationsReveal      | 630..765 (was 180f, now 135f)
// 10   | 25.5–29.0s   | Shot10_DownloadClick           | 765..870
// 11   | 29.0–33.0s   | Shot11_PdfReveal (trimmed)     | 870..990
// 12   | 33.0–36.0s   | Shot12_Outro (cut-to-black)    | 990..1080

// User-aligned timing: click peak must hit video frame 240 (= 8.0s exactly)
// to sync with their song. The video starts 1:02 into the song, so the
// song's intended click cue lands at video 8.0s. Shot 1 was trimmed 42f
// from its hold; those 42f went to Shot 5 (scan now takes 5.2s). Shots
// 6–12 keep their original start times and durations to preserve song sync
// for the rest of the video.
export const SHOTS = {
  s1: { from: 0, durationInFrames: 78 },       // was 120 — hold trimmed by 42f
  s2: { from: 78, durationInFrames: 150 },     // shifted -42 (was 120)
  s3: { from: 228, durationInFrames: 35 },     // shifted -42 — click peak now at video 240 = 8.0s
  s4: { from: 263, durationInFrames: 15 },     // shifted -42
  s5: { from: 278, durationInFrames: 157 },    // shifted -42 + extended (was 320,115)
  s6: { from: 435, durationInFrames: 15 },
  s7: { from: 450, durationInFrames: 120 },
  s8: { from: 570, durationInFrames: 60 },
  s9: { from: 630, durationInFrames: 135 },
  s10: { from: 765, durationInFrames: 105 },
  s11: { from: 870, durationInFrames: 120 },
  s12: { from: 990, durationInFrames: 90 },
};

export const Reveal30: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#F4F6FB" }}>
      <Sequence {...SHOTS.s1}>
        <Shot01_HoldAndPushIn />
      </Sequence>
      <Sequence {...SHOTS.s2}>
        <Shot03_MacroTyping />
      </Sequence>
      <Sequence {...SHOTS.s3}>
        <Shot04_PanCTAClick />
      </Sequence>
      <Sequence {...SHOTS.s4}>
        <Shot05_WhooshProcessing />
      </Sequence>
      <Sequence {...SHOTS.s5}>
        <Shot06_ProcessingMontage />
      </Sequence>
      <Sequence {...SHOTS.s6}>
        <Shot07_WhooshResults />
      </Sequence>
      <Sequence {...SHOTS.s7}>
        <Shot07_ResultsHero />
      </Sequence>
      <Sequence {...SHOTS.s8}>
        <Shot08_TiltToStats />
      </Sequence>
      <Sequence {...SHOTS.s9}>
        <Shot09_ObservationsReveal />
      </Sequence>
      <Sequence {...SHOTS.s10}>
        <Shot10_DownloadClick />
      </Sequence>
      <Sequence {...SHOTS.s11}>
        <Shot11_PdfReveal />
      </Sequence>
      <Sequence {...SHOTS.s12}>
        <Shot12_Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
