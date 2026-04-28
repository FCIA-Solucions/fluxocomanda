import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { colors, fontFamily } from "../theme";

// 7s = 210 frames. CTA final.
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSc = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const titleOp = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [10, 30], [20, 0], { extrapolateRight: "clamp" });

  const trialOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const trialY = interpolate(frame, [30, 50], [20, 0], { extrapolateRight: "clamp" });

  const urlOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });
  const urlY = interpolate(frame, [50, 70], [20, 0], { extrapolateRight: "clamp" });

  const waOp = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" });
  const waY = interpolate(frame, [70, 90], [20, 0], { extrapolateRight: "clamp" });

  // breathing pulse on the CTA button
  const pulse = 1 + Math.sin(frame / 12) * 0.025;

  return (
    <AbsoluteFill style={{ fontFamily, alignItems: "center", justifyContent: "center", padding: 80 }}>
      {/* logo */}
      <div
        style={{
          width: 200,
          height: 200,
          transform: `scale(${logoSc})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: `drop-shadow(0 18px 50px ${colors.primary}66)`,
          marginBottom: 24,
        }}
      >
        <Img src={staticFile("logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>

      <h1
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          color: colors.text,
          fontSize: 76,
          fontWeight: 800,
          margin: 0,
          letterSpacing: -2,
          textAlign: "center",
        }}
      >
        Fluxo<span style={{ color: colors.primary }}>Comanda</span>
      </h1>

      <div
        style={{
          opacity: trialOp,
          transform: `translateY(${trialY}px) scale(${pulse})`,
          marginTop: 36,
          padding: "20px 44px",
          borderRadius: 999,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
          color: "#fff",
          fontSize: 36,
          fontWeight: 800,
          boxShadow: `0 16px 50px ${colors.primary}88`,
        }}
      >
        7 dias grátis
      </div>

      <div
        style={{
          opacity: urlOp,
          transform: `translateY(${urlY}px)`,
          marginTop: 36,
          color: colors.text,
          fontSize: 30,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        fluxocomanda.lovable.app
      </div>

      <div
        style={{
          opacity: waOp,
          transform: `translateY(${waY}px)`,
          marginTop: 18,
          color: colors.muted,
          fontSize: 22,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ color: "#22c55e", fontSize: 26 }}>●</span>
        WhatsApp (94) 99955-3574
      </div>
    </AbsoluteFill>
  );
};
