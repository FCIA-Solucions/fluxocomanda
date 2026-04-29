import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

// Tech executive outro — 8s @ 30fps = 240 frames
export const FciaOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Logo entrance: spring scale + rotate-in
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90, mass: 1 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.4, 1]);
  const logoOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  const logoRotate = interpolate(logoSpring, [0, 1], [-12, 0]);

  // Subtle continuous breathing
  const breathe = 1 + Math.sin(frame / 22) * 0.012;
  // Subtle float (reduced amplitude to avoid jump perception in 1:1)
  const floatY = Math.sin(frame / 28) * 3;

  // Glow pulse
  const glowPulse = 0.55 + Math.sin(frame / 18) * 0.25;

  // Energy ring expand on entrance
  const ring1 = spring({ frame: frame - 6, fps, config: { damping: 18 } });
  const ring2 = spring({ frame: frame - 14, fps, config: { damping: 18 } });

  // Slogan reveal — fade + slide + letter-spacing collapse
  const sloganStart = 36;
  const sloganOp = interpolate(frame, [sloganStart, sloganStart + 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sloganY = interpolate(
    frame,
    [sloganStart, sloganStart + 30],
    [22, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const sloganSpacing = interpolate(
    frame,
    [sloganStart, sloganStart + 40],
    [18, 6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Underline draw
  const lineStart = 60;
  const lineScale = interpolate(frame, [lineStart, lineStart + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Brand line "FCIA — Soluções em Tecnologia" later reveal
  const brandStart = 78;
  const brandOp = interpolate(frame, [brandStart, brandStart + 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Final fade out at the end (last 20 frames)
  const fadeOut = interpolate(frame, [220, 240], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sweep highlight across logo (single pass around frame 90-130)
  const sweepProgress = interpolate(frame, [90, 140], [-1.2, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isSquare = width === height;
  const logoSize = isSquare ? Math.min(width, height) * 0.42 : Math.min(width, height) * 0.5;

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        background:
          "radial-gradient(ellipse at 50% 40%, #1a1244 0%, #0a0a1f 55%, #050510 100%)",
        opacity: fadeOut,
        overflow: "hidden",
      }}
    >
      {/* Animated grid backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(120,180,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(120,180,255,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          transform: `translateY(${(frame * 0.4) % 60}px)`,
        }}
      />

      {/* Soft color blobs */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "60%",
          height: "60%",
          background: "radial-gradient(circle, rgba(99,102,241,0.35), transparent 60%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "60%",
          height: "60%",
          background: "radial-gradient(circle, rgba(168,85,247,0.32), transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {/* Center content */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: isSquare ? 24 : 30,
          padding: 60,
        }}
      >
        {/* Logo with rings */}
        <div
          style={{
            position: "relative",
            width: logoSize,
            height: logoSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translateY(${floatY}px)`,
          }}
        >
          {/* Expanding rings */}
          {[ring1, ring2].map((r, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `2px solid rgba(139,92,246,${0.6 * (1 - r)})`,
                transform: `scale(${1 + r * (0.55 + i * 0.25)})`,
                opacity: 1 - r,
              }}
            />
          ))}

          {/* Glow */}
          <div
            style={{
              position: "absolute",
              inset: "-8%",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(139,92,246,0.55), transparent 65%)",
              filter: "blur(30px)",
              opacity: glowPulse * logoOpacity,
            }}
          />

          {/* Logo image */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transform: `scale(${logoScale * breathe}) rotate(${logoRotate}deg)`,
              opacity: logoOpacity,
              filter: "drop-shadow(0 20px 60px rgba(139,92,246,0.6))",
            }}
          >
            <Img
              src={staticFile("fcia-logo.png")}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            {/* Sweep highlight */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(115deg, transparent ${
                  sweepProgress * 100 - 8
                }%, rgba(255,255,255,0.35) ${sweepProgress * 100}%, transparent ${
                  sweepProgress * 100 + 8
                }%)`,
                mixBlendMode: "overlay",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Slogan */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            opacity: sloganOp,
            transform: `translateY(${sloganY}px)`,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: isSquare ? 64 : 72,
              fontWeight: 300,
              letterSpacing: sloganSpacing,
              color: "#F8FAFC",
              textTransform: "uppercase",
              textAlign: "center",
              background:
                "linear-gradient(180deg, #ffffff 0%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 40px rgba(139,92,246,0.5)",
            }}
          >
            Soluções <span style={{ fontWeight: 700 }}>Inteligentes</span>
          </h1>

          {/* Animated underline */}
          <div
            style={{
              width: isSquare ? 380 : 460,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #8b5cf6 20%, #06b6d4 80%, transparent)",
              transform: `scaleX(${lineScale})`,
              transformOrigin: "center",
              boxShadow: "0 0 12px rgba(139,92,246,0.8)",
            }}
          />

          {/* Brand line */}
          <p
            style={{
              margin: 0,
              marginTop: 4,
              fontSize: isSquare ? 22 : 24,
              fontWeight: 400,
              letterSpacing: 8,
              color: "#94a3b8",
              textTransform: "uppercase",
              opacity: brandOp,
            }}
          >
            FCIA · Soluções em Tecnologia
          </p>
        </div>
      </AbsoluteFill>

      {/* Top + bottom executive bars */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background:
            "linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, transparent)",
          opacity: interpolate(frame, [10, 40], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background:
            "linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent)",
          opacity: interpolate(frame, [10, 40], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
