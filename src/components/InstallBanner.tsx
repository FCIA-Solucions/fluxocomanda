import { useEffect, useState } from "react";
import { X, Download, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "fluxo_install_dismissed";

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document)
  );
}

function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/i.test(window.navigator.userAgent);
}

function isInStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

type Mode = "native" | "ios" | "android-manual" | null;

interface InstallBannerProps {
  /** Ignora o "não mostrar novamente" salvo (útil na página /instalar). */
  forceShow?: boolean;
  /** Esconde o botão "X" de dispensar (útil quando o banner é o próprio CTA da página). */
  hideDismiss?: boolean;
}

export function InstallBanner({ forceShow = false, hideDismiss = false }: InstallBannerProps = {}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!forceShow && localStorage.getItem(DISMISS_KEY) === "1") return;
    if (isInStandalone()) return;

    // 1) Já temos um prompt capturado em main.tsx?
    if (window.__deferredInstallPrompt) {
      setDeferred(window.__deferredInstallPrompt as BeforeInstallPromptEvent);
      setMode("native");
      return;
    }

    // 2) Escutar futuras emissões do evento
    const onAvailable = () => {
      if (window.__deferredInstallPrompt) {
        setDeferred(window.__deferredInstallPrompt as BeforeInstallPromptEvent);
        setMode("native");
      }
    };
    window.addEventListener("pwa-install-available", onAvailable);

    // 3) Fallback: iOS nunca dispara o evento — mostrar instruções manuais
    if (isIOS()) {
      setMode("ios");
    } else if (isAndroid()) {
      // 4) Android sem evento (ainda não disparou ou navegador não suporta):
      // mostra um botão que abre instruções manuais. Após 2.5s sem evento,
      // o banner aparece como "Instalar (manual)".
      const timer = window.setTimeout(() => {
        if (!window.__pwaInstallReady) {
          setMode("android-manual");
        }
      }, 2500);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("pwa-install-available", onAvailable);
      };
    }

    const onInstalled = () => {
      setMode(null);
      setDeferred(null);
    };
    window.addEventListener("pwa-installed", onInstalled);

    return () => {
      window.removeEventListener("pwa-install-available", onAvailable);
      window.removeEventListener("pwa-installed", onInstalled);
    };
  }, []);

  if (!mode) return null;

  const install = async () => {
    if (mode === "ios" || mode === "android-manual") {
      setShowHelpModal(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
      setMode(null);
      setDeferred(null);
      window.__deferredInstallPrompt = null;
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setMode(null);
    setShowHelpModal(false);
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-card p-3">
        <div className="flex-1 text-sm text-foreground">
          📲 Instale o app no seu celular
        </div>
        <Button size="sm" onClick={install} className="h-9">
          <Download className="mr-1 h-4 w-4" />
          Instalar
        </Button>
        {!hideDismiss && (
          <button
            onClick={dismiss}
            aria-label="Dispensar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showHelpModal && mode === "ios" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 pt-20 sm:items-center"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Instalar no iPhone
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Siga os 2 passos abaixo no Safari:
                </p>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                aria-label="Fechar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ol className="space-y-3">
              <li className="flex items-center gap-3 rounded-xl bg-background p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  1
                </span>
                <span className="flex-1 text-sm text-foreground">
                  Toque em{" "}
                  <Share className="inline h-4 w-4 align-text-bottom text-primary" />{" "}
                  <span className="font-semibold">Compartilhar</span> na barra
                  do Safari
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl bg-background p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  2
                </span>
                <span className="flex-1 text-sm text-foreground">
                  Escolha{" "}
                  <Plus className="inline h-4 w-4 align-text-bottom text-primary" />{" "}
                  <span className="font-semibold">
                    Adicionar à Tela de Início
                  </span>
                </span>
              </li>
            </ol>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              ⚠️ Use o Safari (não Chrome) para conseguir instalar no iPhone.
            </p>

            <Button
              variant="ghost"
              onClick={dismiss}
              className="mt-2 w-full text-sm text-muted-foreground"
            >
              Não mostrar novamente
            </Button>
          </div>
        </div>
      )}

      {showHelpModal && mode === "android-manual" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 pt-20 sm:items-center"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Instalar no Android
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Siga os passos abaixo no Chrome:
                </p>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                aria-label="Fechar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ol className="space-y-3">
              <li className="flex items-center gap-3 rounded-xl bg-background p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  1
                </span>
                <span className="flex-1 text-sm text-foreground">
                  Toque no menu{" "}
                  <MoreVertical className="inline h-4 w-4 align-text-bottom text-primary" />{" "}
                  <span className="font-semibold">(3 pontinhos)</span> no canto
                  superior direito
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl bg-background p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  2
                </span>
                <span className="flex-1 text-sm text-foreground">
                  Escolha{" "}
                  <span className="font-semibold">
                    "Instalar app" ou "Adicionar à tela inicial"
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl bg-background p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  3
                </span>
                <span className="flex-1 text-sm text-foreground">
                  Confirme tocando em{" "}
                  <span className="font-semibold">"Instalar"</span>
                </span>
              </li>
            </ol>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              💡 Use o <span className="font-semibold">Chrome</span> ou{" "}
              <span className="font-semibold">Edge</span> para a melhor
              experiência.
            </p>

            <Button
              variant="ghost"
              onClick={dismiss}
              className="mt-2 w-full text-sm text-muted-foreground"
            >
              Não mostrar novamente
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
