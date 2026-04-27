import { loadFont } from "@remotion/google-fonts/Inter";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const colors = {
  bg: "#0F172A",
  bgDeep: "#0B1220",
  card: "#1E293B",
  cardLight: "#273349",
  border: "rgba(148,163,184,0.14)",
  primary: "#22C55E",
  primaryDark: "#16A34A",
  text: "#F8FAFC",
  muted: "#94A3B8",
  pix: "#10B981",
  card2: "#3B82F6",
  cash: "#F59E0B",
};
