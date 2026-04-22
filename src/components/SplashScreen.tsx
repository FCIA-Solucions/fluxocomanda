import { useEffect, useState } from "react";

interface SplashScreenProps {
  onDone: () => void;
  duration?: number;
}

export function SplashScreen({ onDone, duration = 2000 }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), duration - 400);
    const doneTimer = setTimeout(onDone, duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#0f172a" }}
      aria-hidden={fadeOut}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <img
          src="/icon-192.png"
          alt="FluxoComanda"
          className="h-24 w-24 animate-in fade-in zoom-in-50 rounded-3xl shadow-2xl duration-700"
        />
        <h1 className="mt-6 text-3xl font-bold text-white animate-in fade-in slide-in-from-bottom-2 duration-700">
          FluxoComanda
        </h1>
      </div>
      <div className="pb-8 text-center text-xs text-slate-400">
        by <span className="font-bold" style={{ color: "#22c55e" }}>FCIA</span>
      </div>
    </div>
  );
}
