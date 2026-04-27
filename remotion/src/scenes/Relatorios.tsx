import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";

// 7s = 210 frames. Relatorios: bar chart growing.
export const Relatorios: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const headerY = interpolate(frame, [0, 15], [-20, 0], { extrapolateRight: "clamp" });

  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const values = [40, 65, 50, 75, 90, 100, 70];

  const totalToday = interpolate(frame, [10, 80], [0, 3700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ticket = interpolate(frame, [30, 100], [0, 47], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
          📊 RELATÓRIOS
        </div>
        <h2 style={{ fontSize: 56, color: colors.text, margin: "16px 0 0 0", fontWeight: 800, letterSpacing: -1 }}>
          Saiba o que vende
          <br />
          <span style={{ color: colors.primary }}>quando e como</span>
        </h2>
      </div>

      {/* Stats row */}
      <div style={{ marginTop: 50, display: "flex", gap: 20 }}>
        <StatCard label="Hoje" value={`R$ ${totalToday.toFixed(0)}`} color={colors.primary} />
        <StatCard label="Ticket médio" value={`R$ ${ticket.toFixed(0)}`} color={colors.pix} />
      </div>

      {/* Bar chart */}
      <div
        style={{
          marginTop: 36,
          width: "100%",
          maxWidth: 760,
          background: colors.card,
          borderRadius: 24,
          padding: 28,
          border: `1px solid ${colors.border}`,
          boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ fontSize: 18, color: colors.muted, marginBottom: 18, fontWeight: 600 }}>
          Vendas da semana
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 280 }}>
          {values.map((v, i) => {
            const localFrame = frame - 30 - i * 6;
            const h = spring({ frame: localFrame, fps, config: { damping: 15, stiffness: 90 } });
            const op = interpolate(localFrame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div
                key={i}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${h * v * 2.4}px`,
                    background:
                      i === values.length - 2
                        ? `linear-gradient(to top, ${colors.primaryDark}, ${colors.primary})`
                        : `linear-gradient(to top, ${colors.cardLight}, #475569)`,
                    borderRadius: 10,
                    opacity: op,
                    boxShadow:
                      i === values.length - 2 ? `0 0 30px ${colors.primary}66` : "none",
                  }}
                />
                <div style={{ fontSize: 14, color: colors.muted, fontWeight: 600 }}>{days[i]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StatCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div
    style={{
      background: colors.card,
      borderRadius: 18,
      padding: "16px 28px",
      border: `1px solid ${colors.border}`,
      minWidth: 220,
    }}
  >
    <div style={{ fontSize: 16, color: colors.muted, fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: 36, color, fontWeight: 800, marginTop: 4 }}>{value}</div>
  </div>
);
