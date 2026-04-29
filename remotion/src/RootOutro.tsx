import React from "react";
import { Composition } from "remotion";
import { FciaOutro } from "./scenes/FciaOutro";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="outro-square"
        component={FciaOutro}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="outro-wide"
        component={FciaOutro}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
