import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { colors, fontFamily } from "../theme";

// 0-4s = 120 frames. Hook: papel rasgando -> celular sobe.
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // text rise
  const textOpacity = interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const textY = interpolate(frame, [5, 25], [30, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // app reveal earlier (frame 50) since there's no paper tear act
  const appScale = spring({ frame: frame - 50, fps, config: { damping: 14, stiffness: 120 } });
  const appOpacity = interpolate(frame - 50, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
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

      {/* App phone reveal */}
      {appOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            transform: `scale(${appScale * 0.6 + 0.4}) translateY(${(1 - appScale) * 200}px)`,
            opacity: appOpacity,
            width: 240,
            height: 480,
            borderRadius: 36,
            background: colors.card,
            border: `8px solid #000`,
            boxShadow: `0 30px 80px ${colors.primary}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 30,
          }}
        >
          <Img src={staticFile("logo.png")} style={{ width: "100%", height: "auto" }} />
        </div>
      )}
    </AbsoluteFill>
  );
};
