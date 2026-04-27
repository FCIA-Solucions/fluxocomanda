import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";

// 6s = 180 frames. PWA install: app icon jumps to home screen.
export const PWA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const headerY = interpolate(frame, [0, 15], [-20, 0], { extrapolateRight: "clamp" });

  // Phone home screen reveal
  const phoneIn = spring({ frame: frame - 5, fps, config: { damping: 14 } });

  // Icon jumps in at frame 60
  const jump = spring({ frame: frame - 60, fps, config: { damping: 8, stiffness: 120 } });
  const iconY = interpolate(jump, [0, 1], [-200, 0]);
  const iconScale = interpolate(jump, [0, 1], [0.4, 1]);

  // pulse highlight
  const pulse = interpolate(frame, [80, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulseOpacity = 1 - pulse;

  // grid icons
  const otherIcons = ["💬", "📷", "🎵", "📩", "📅", "🗺️", "⚙️", "🌤️"];

  return (
    <AbsoluteFill style={{ fontFamily, alignItems: "center", justifyContent: "flex-start", padding: 80 }}>
      <div
        style={{
          opacity: headerOp,
          transform: `translateY(${headerY}px)`,
          textAlign: "center",
          marginTop: 10,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 20px",
            borderRadius: 999,
            background: `${colors.primary}22`,
            border: `1px solid ${colors.primary}55`,
            color: colors.primary,
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          📱 NO CELULAR
        </div>
        <h2 style={{ fontSize: 56, color: colors.text, margin: "16px 0 0 0", fontWeight: 800, letterSpacing: -1 }}>
          Instala como app
          <br />
          em <span style={{ color: colors.primary }}>qualquer aparelho</span>
        </h2>
      </div>

      {/* Phone with home screen */}
      <div
        style={{
          marginTop: 40,
          transform: `scale(${phoneIn * 0.2 + 0.8}) translateY(${(1 - phoneIn) * 30}px)`,
        }}
      >
        <div
          style={{
            width: 320,
            height: 600,
            borderRadius: 44,
            background: "#000",
            padding: 8,
            boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 36,
              background: `linear-gradient(170deg, #1e3a8a, #312e81 60%, #4c1d95)`,
              overflow: "hidden",
              position: "relative",
              padding: "60px 24px 24px",
            }}
          >
            <div
              style={{
                color: "#fff",
                fontSize: 14,
                opacity: 0.9,
                textAlign: "center",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              segunda-feira, 27
            </div>
            <div
              style={{
                color: "#fff",
                fontSize: 48,
                textAlign: "center",
                fontWeight: 700,
                marginBottom: 28,
              }}
            >
              9:41
            </div>

            {/* icon grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 18,
              }}
            >
              {otherIcons.map((emoji, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1 / 1",
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {emoji}
                </div>
              ))}
              {/* FluxoComanda icon (jumps in) */}
              <div
                style={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#fff",
                  transform: `translateY(${iconY}px) scale(${iconScale})`,
                  boxShadow: `0 8px 30px ${colors.primary}aa`,
                }}
              >
                F
                {/* pulse ring */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 14,
                    border: `3px solid ${colors.primary}`,
                    transform: `scale(${1 + pulse * 0.5})`,
                    opacity: pulseOpacity,
                  }}
                />
              </div>
            </div>

            {/* dock */}
            <div
              style={{
                position: "absolute",
                bottom: 18,
                left: 18,
                right: 18,
                background: "rgba(255,255,255,0.18)",
                borderRadius: 22,
                padding: 12,
                display: "flex",
                justifyContent: "space-around",
              }}
            >
              {["📞", "✉️", "🌐", "🎵"].map((e, i) => (
                <div
                  key={i}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
