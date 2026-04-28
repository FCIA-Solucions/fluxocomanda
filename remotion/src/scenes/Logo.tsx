import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { colors, fontFamily } from "../theme";

// 4s-9s = 150 frames. Logo + tagline.
export const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const ringScale = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  const titleOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const titleY = interpolate(frame, [20, 40], [30, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const taglineOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const taglineY = interpolate(frame, [40, 60], [20, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // subtle pulse
  const pulse = 1 + Math.sin(frame / 14) * 0.02;

  return (
    <AbsoluteFill style={{ fontFamily, alignItems: "center", justifyContent: "center", padding: 80 }}>
      {/* logo mark */}
      <div style={{ position: "relative", width: 280, height: 280, marginBottom: 30 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${logoScale * pulse})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: `drop-shadow(0 20px 60px ${colors.primary}66)`,
          }}
        >
          <Img src={staticFile("logo.png")} style={{ width: "100%", height: "100%" }} />
        </div>
        {/* expanding ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 56,
            border: `3px solid ${colors.primary}`,
            transform: `scale(${1 + ringScale * 0.5})`,
            opacity: 1 - ringScale,
          }}
        />
      </div>

      <h1
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          fontSize: 84,
          fontWeight: 800,
          margin: 0,
          color: colors.text,
          letterSpacing: -2,
        }}
      >
        Fluxo<span style={{ color: colors.primary }}>Comanda</span>
      </h1>
      <p
        style={{
          opacity: taglineOp,
          transform: `translateY(${taglineY}px)`,
          fontSize: 32,
          color: colors.muted,
          marginTop: 20,
          textAlign: "center",
          fontWeight: 500,
        }}
      >
        Suas comandas, seu caixa,
        <br />
        <span style={{ color: colors.text, fontWeight: 600 }}>no seu bolso.</span>
      </p>
    </AbsoluteFill>
  );
};
