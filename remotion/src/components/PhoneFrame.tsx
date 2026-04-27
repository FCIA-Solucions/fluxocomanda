import React from "react";
import { colors, fontFamily } from "../theme";

interface Props {
  children: React.ReactNode;
  scale?: number;
}

// Mobile phone mockup frame, 9:19 viewport. Default scale fits 1080x1080 nicely.
export const PhoneFrame: React.FC<Props> = ({ children, scale = 1 }) => {
  const w = 360;
  const h = 760;
  return (
    <div
      style={{
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: "center",
        borderRadius: 48,
        background: "#000",
        padding: 10,
        boxShadow:
          "0 40px 80px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.06), inset 0 0 0 2px rgba(255,255,255,0.04)",
        position: "relative",
        fontFamily,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 40,
          background: colors.bg,
          overflow: "hidden",
          position: "relative",
          color: colors.text,
        }}
      >
        {/* notch */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: 110,
            height: 28,
            borderRadius: 20,
            background: "#000",
            zIndex: 10,
          }}
        />
        {/* status bar */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 22,
            right: 22,
            display: "flex",
            justifyContent: "space-between",
            color: colors.text,
            fontSize: 12,
            fontWeight: 600,
            zIndex: 11,
          }}
        >
          <span>9:41</span>
          <span style={{ opacity: 0 }}>·</span>
          <span>5G</span>
        </div>
        <div style={{ paddingTop: 56, height: "100%" }}>{children}</div>
      </div>
    </div>
  );
};
