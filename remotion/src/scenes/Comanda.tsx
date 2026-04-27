import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { colors, fontFamily } from "../theme";

// 8s = 240 frames. Scene: open new comanda + add items.
export const Comanda: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const headerY = interpolate(frame, [0, 15], [-20, 0], { extrapolateRight: "clamp" });

  const phoneIn = spring({ frame: frame - 5, fps, config: { damping: 14 } });

  // typing "Mesa 7"
  const text = "Mesa 7";
  const typedLen = Math.min(text.length, Math.max(0, Math.floor((frame - 25) / 6)));
  const typed = text.slice(0, typedLen);

  // tap on first product (frame 75), products appearing
  const products = [
    { name: "Coca-Cola 350ml", price: "R$ 7,00", emoji: "🥤" },
    { name: "Hambúrguer", price: "R$ 28,00", emoji: "🍔" },
    { name: "Batata frita", price: "R$ 18,00", emoji: "🍟" },
  ];

  const items: { delay: number; product: typeof products[number] }[] = [
    { delay: 80, product: products[0] },
    { delay: 105, product: products[1] },
    { delay: 130, product: products[2] },
  ];

  // total counter
  const total = interpolate(frame, [80, 160], [0, 53], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // side caption
  const captionOp = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily, alignItems: "center", justifyContent: "center" }}>
      {/* Top label */}
      <div
        style={{
          position: "absolute",
          top: 50,
          opacity: headerOp,
          transform: `translateY(${headerY}px)`,
          textAlign: "center",
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
          ⚡ AGILIDADE
        </div>
        <h2 style={{ fontSize: 44, color: colors.text, margin: "12px 0 0 0", fontWeight: 800, letterSpacing: -1 }}>
          Comanda em <span style={{ color: colors.primary }}>segundos</span>
        </h2>
      </div>

      {/* Phone */}
      <div style={{ transform: `scale(${phoneIn * 0.3 + 0.7}) translateY(${(1 - phoneIn) * 50}px)`, marginTop: 220 }}>
        <PhoneFrame scale={1.05}>
          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 11, color: colors.muted }}>Nova Comanda</div>
            <div
              style={{
                marginTop: 8,
                background: colors.card,
                borderRadius: 14,
                padding: "14px 14px",
                border: `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: colors.text, minHeight: 24 }}>
                {typed}
                {frame % 30 < 15 && typedLen < text.length ? (
                  <span style={{ color: colors.primary }}>|</span>
                ) : null}
              </span>
            </div>

            <div style={{ marginTop: 14, fontSize: 11, color: colors.muted }}>Itens</div>

            {items.map(({ delay, product }, idx) => {
              const localFrame = frame - delay;
              const op = interpolate(localFrame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const y = interpolate(localFrame, [0, 12], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const sc = spring({ frame: localFrame, fps, config: { damping: 12 } });
              return (
                <div
                  key={idx}
                  style={{
                    opacity: op,
                    transform: `translateY(${y}px) scale(${0.9 + sc * 0.1})`,
                    marginTop: 10,
                    background: colors.card,
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ fontSize: 24 }}>{product.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: colors.muted }}>{product.price}</div>
                  </div>
                  <div
                    style={{
                      background: colors.primary,
                      color: "#fff",
                      borderRadius: 8,
                      padding: "4px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    1x
                  </div>
                </div>
              );
            })}

            {/* Total bar at bottom */}
            <div
              style={{
                marginTop: 16,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#fff",
                boxShadow: `0 8px 24px ${colors.primary}55`,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
        </PhoneFrame>
      </div>

      {/* Bottom caption */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          opacity: captionOp,
          color: colors.muted,
          fontSize: 26,
          fontWeight: 500,
          textAlign: "center",
        }}
      >
        Sem papel · Sem erro · Sem fila
      </div>
    </AbsoluteFill>
  );
};
