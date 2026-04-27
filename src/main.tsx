import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ============================================================
// PWA — capturar beforeinstallprompt o mais cedo possível
// (precisa rodar ANTES do React montar, senão perdemos o evento)
// ============================================================
declare global {
  interface Window {
    __deferredInstallPrompt?: Event | null;
    __pwaInstallReady?: boolean;
  }
}

window.__deferredInstallPrompt = null;
window.__pwaInstallReady = false;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__deferredInstallPrompt = e;
  window.__pwaInstallReady = true;
  // Notificar componentes React que já podem mostrar o banner
  window.dispatchEvent(new CustomEvent("pwa-install-available"));
});

window.addEventListener("appinstalled", () => {
  window.__deferredInstallPrompt = null;
  window.__pwaInstallReady = false;
  window.dispatchEvent(new CustomEvent("pwa-installed"));
});

createRoot(document.getElementById("root")!).render(<App />);

// ============================================================
// Registro do Service Worker (PWA)
// — apenas em produção, fora do iframe do Lovable
// ============================================================
if ("serviceWorker" in navigator) {
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    (host.includes("lovable.app") && host.startsWith("id-preview"));

  if (isInIframe || isPreviewHost) {
    // Limpa qualquer SW previamente registrado em contexto de preview
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Verifica imediatamente se há nova versão disponível
          reg.update().catch(() => {});

          // Quando uma nova versão do SW for instalada e ativada,
          // recarrega a página automaticamente para pegar os assets novos.
          reg.addEventListener("updatefound", () => {
            const newSW = reg.installing;
            if (!newSW) return;
            newSW.addEventListener("statechange", () => {
              if (
                newSW.state === "activated" &&
                navigator.serviceWorker.controller
              ) {
                window.location.reload();
              }
            });
          });
        })
        .catch(() => {});

      // Fallback: se o SW controlador mudar (nova versão assumiu),
      // recarrega para garantir consistência dos assets.
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  }
}
