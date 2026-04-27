import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";

import { PersistentBackground } from "./components/PersistentBackground";
import { Hook } from "./scenes/Hook";
import { Logo } from "./scenes/Logo";
import { Comanda } from "./scenes/Comanda";
import { Caixa } from "./scenes/Caixa";
import { Relatorios } from "./scenes/Relatorios";
import { PWA } from "./scenes/PWA";
import { CTA } from "./scenes/CTA";

// Composition: 1350 frames @30fps = 45s
// Scene durations (frames): Hook 120, Logo 150, Comanda 240, Caixa 240, Relatorios 210, PWA 180, CTA 240 = 1380
// Each transition is 18 frames and overlaps by that much. 6 transitions => -108 => 1272. Pad CTA.
// Recalibrate to total 1350: 120+150+240+240+210+180+240 = 1380. Minus 6*18=108 overlap => 1272 visible.
// Better: keep durations and durationInFrames=1272. We'll update Root to 1272.

export const MainVideo: React.FC = () => {
  const t = (frames: number) => springTiming({ config: { damping: 200 }, durationInFrames: frames });
  const fadeT = (frames: number) => linearTiming({ durationInFrames: frames });

  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={fadeT(18)} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <Logo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={t(20)} />

        <TransitionSeries.Sequence durationInFrames={240}>
          <Comanda />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t(20)} />

        <TransitionSeries.Sequence durationInFrames={240}>
          <Caixa />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t(20)} />

        <TransitionSeries.Sequence durationInFrames={210}>
          <Relatorios />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={t(20)} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <PWA />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={fadeT(18)} />

        <TransitionSeries.Sequence durationInFrames={240}>
          <CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
