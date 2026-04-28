import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors, fontFamily } from "../theme";

// 0-4s = 120 frames. Hook: pergunta de impacto centralizada.
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();

  const textOpacity = interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const textY = interpolate(frame, [5, 25], [30, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // sutil respiração para não ficar parado
  const breathe = Math.sin(frame / 18) * 4;

  return (
    <AbsoluteFill style={{ fontFamily, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity: textOpacity,
          transform: `translateY(${textY + breathe}px)`,
          textAlign: "center",
          color: colors.text,
          padding: 60,
          maxWidth: 900,
        }}
      >
        <p style={{ fontSize: 36, color: colors.muted, margin: 0, fontWeight: 500 }}>Cansado de</p>
        <h1
          style={{
            fontSize: 88,
            fontWeight: 800,
            margin: "12px 0 0 0",
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          anotar comanda
          <br />
          <span style={{ color: colors.primary }}>no papel?</span>
        </h1>
      </div>
    </AbsoluteFill>
  );
};
