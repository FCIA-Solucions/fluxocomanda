import { useEffect, useState } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "fluxo_install_dismissed";

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPad/iPhone/iPod ou iPad rodando iPadOS (que se identifica como Mac)
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document)
  );
}

function isInStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [iosUser, setIosUser] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (isInStandalone()) return;

    // Android/Chrome: aguardar beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS/Safari: nunca dispara beforeinstallprompt — mostrar instruções manualmente
    if (isIOS()) {
      setIosUser(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible) return null;

  const install = async () => {
    if (iosUser) {
      setShowIosModal(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
      setVisible(false);
      setDeferred(null);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setShowIosModal(false);
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
        <button
          onClick={dismiss}
          aria-label="Dispensar"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {showIosModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 pt-20 sm:items-center"
          onClick={() => setShowIosModal(false)}
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
                onClick={() => setShowIosModal(false)}
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
    </>
  );
}
