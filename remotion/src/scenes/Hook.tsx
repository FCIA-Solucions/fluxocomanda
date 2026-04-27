import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";

// 0-4s = 120 frames. Hook: papel rasgando -> celular sobe.
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // paper tear progress (0..1) over first 60 frames
  const tear = interpolate(frame, [10, 55], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const paperOpacity = interpolate(frame, [55, 75], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // text rise
  const textOpacity = interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const textY = interpolate(frame, [5, 25], [30, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // app reveal at frame 65
  const appScale = spring({ frame: frame - 65, fps, config: { damping: 14, stiffness: 120 } });
  const appOpacity = interpolate(frame - 65, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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

      {/* Paper sheet */}
      <div
        style={{
          position: "absolute",
          top: "60%",
          width: 420,
          height: 320,
          background: "#f5efe0",
          borderRadius: 6,
          boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
          opacity: paperOpacity,
          transform: `rotate(-3deg)`,
          clipPath: `polygon(0 0, 100% 0, 100% 100%, ${50 + tear / 2}% 100%, 50% ${100 - tear * 0.6}%, ${50 - tear / 2}% 100%, 0 100%)`,
          padding: 28,
          fontFamily: "'Courier New', monospace",
          color: "#444",
        }}
      >
        <div style={{ borderBottom: "1px solid #c9bfa6", paddingBottom: 8, fontSize: 18, fontWeight: 700 }}>
          Mesa 7 — Comanda
        </div>
        <div style={{ marginTop: 14, fontSize: 16, lineHeight: 1.7 }}>
          <div>2x Coca-Cola</div>
          <div>1x Hambúrguer</div>
          <div>1x Batata frita</div>
          <div style={{ opacity: 0.5 }}>3x ?????</div>
        </div>
      </div>

      {/* App phone reveal */}
      {appOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: -100,
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
            color: colors.primary,
            fontSize: 60,
            fontWeight: 800,
          }}
        >
          ✓
        </div>
      )}
    </AbsoluteFill>
  );
};
