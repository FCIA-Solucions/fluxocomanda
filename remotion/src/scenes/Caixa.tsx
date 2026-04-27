import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";

// 8s = 240 frames. Caixa: 3 cards Pix/Cartão/Dinheiro com valores subindo.
export const Caixa: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const headerY = interpolate(frame, [0, 15], [-20, 0], { extrapolateRight: "clamp" });

  const totals = [
    { label: "Pix", icon: "⚡", value: 1840, color: colors.pix, delay: 20 },
    { label: "Cartão", icon: "💳", value: 1240, color: colors.card2, delay: 40 },
    { label: "Dinheiro", icon: "💵", value: 620, color: colors.cash, delay: 60 },
  ];

  const grandTotal = totals.reduce((s, t) => {
    const v = interpolate(frame - t.delay, [0, 60], [0, t.value], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return s + v;
  }, 0);

  return (
    <AbsoluteFill style={{ fontFamily, alignItems: "center", justifyContent: "flex-start", padding: 80 }}>
      <div
        style={{
          opacity: headerOp,
          transform: `translateY(${headerY}px)`,
          textAlign: "center",
          marginTop: 20,
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
          💰 CAIXA DO DIA
        </div>
        <h2 style={{ fontSize: 56, color: colors.text, margin: "16px 0 0 0", fontWeight: 800, letterSpacing: -1 }}>
          Tudo separado por <br />
          <span style={{ color: colors.primary }}>forma de pagamento</span>
        </h2>
      </div>

      {/* Cards */}
      <div style={{ marginTop: 60, width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", gap: 18 }}>
        {totals.map((t, i) => {
          const localFrame = frame - t.delay;
          const op = interpolate(localFrame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(localFrame, [0, 18], [-60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sc = spring({ frame: localFrame, fps, config: { damping: 14 } });
          const value = interpolate(localFrame, [0, 60], [0, t.value], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const barW = interpolate(localFrame, [0, 60], [0, (t.value / 1840) * 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                opacity: op,
                transform: `translateX(${x}px) scale(${0.95 + sc * 0.05})`,
                background: colors.card,
                borderRadius: 22,
                padding: 24,
                border: `1px solid ${colors.border}`,
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    background: `${t.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                  }}
                >
                  {t.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, color: colors.muted, fontWeight: 500 }}>{t.label}</div>
                  <div style={{ fontSize: 36, color: colors.text, fontWeight: 800, marginTop: 2 }}>
                    R$ {value.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: 14,
                  height: 8,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barW}%`,
                    height: "100%",
                    background: t.color,
                    boxShadow: `0 0 20px ${t.color}88`,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand total */}
      <div
        style={{
          marginTop: 32,
          padding: "18px 36px",
          borderRadius: 999,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
          color: "#fff",
          fontSize: 32,
          fontWeight: 800,
          boxShadow: `0 14px 40px ${colors.primary}66`,
        }}
      >
        Total: R$ {grandTotal.toFixed(2).replace(".", ",")}
      </div>
    </AbsoluteFill>
  );
};
