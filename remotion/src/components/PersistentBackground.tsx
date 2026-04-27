import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { colors } from "../theme";

// Animated dark background with drifting green blobs + subtle grid.
export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const t = frame / durationInFrames;
  const x1 = interpolate(t, [0, 1], [-150, width * 0.4]);
  const y1 = interpolate(t, [0, 1], [height * 0.1, height * 0.6]);
  const x2 = interpolate(t, [0, 1], [width * 0.7, width * 0.2]);
  const y2 = interpolate(t, [0, 1], [height * 0.7, height * 0.2]);
  const x3 = interpolate(t, [0, 1], [width * 0.3, width * 0.8]);
  const y3 = interpolate(t, [0, 1], [height * 0.9, height * 0.4]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at top, ${colors.bg} 0%, ${colors.bgDeep} 100%)`,
      }}
    >
      {/* subtle grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.6,
        }}
      />
      {/* blobs */}
      <Blob x={x1} y={y1} size={600} color={colors.primary} opacity={0.18} />
      <Blob x={x2} y={y2} size={500} color="#10B981" opacity={0.12} />
      <Blob x={x3} y={y3} size={450} color={colors.primaryDark} opacity={0.10} />

      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Blob: React.FC<{ x: number; y: number; size: number; color: string; opacity: number }> = ({
  x,
  y,
  size,
  color,
  opacity,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      filter: `blur(120px)`,
      opacity,
    }}
  />
);
