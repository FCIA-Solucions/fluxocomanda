import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, Apple, Monitor, CheckCircle2, Share, Plus, MoreVertical, Zap, WifiOff, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallBanner } from "@/components/InstallBanner";
import fciaLogo from "@/assets/fcia-logo.png";

type Platform = "android" | "ios" | "desktop";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";
  const ua = window.navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document)) {
    return "ios";
  }
  return "desktop";
}

function isInStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

export default function Instalar() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isInStandalone());

    const onInstalled = () => setInstalled(true);
    window.addEventListener("pwa-installed", onInstalled);
    return () => window.removeEventListener("pwa-installed", onInstalled);
  }, []);

  const installUrl = typeof window !== "undefined"
    ? `${window.location.origin}/instalar`
    : "https://fluxocomanda.lovable.app/instalar";

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <img
            src="/icon-192.png"
            alt="FluxoComanda"
            className="mx-auto mb-4 h-20 w-20 rounded-2xl shadow-lg"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            FluxoComanda
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Instale o app no seu celular em 10 segundos
          </p>
        </div>

        {installed ? (
          <div className="rounded-2xl bg-card p-6 text-center shadow-xl">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-primary" />
            <h2 className="text-xl font-bold text-foreground">App já instalado! 🎉</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Você está usando o FluxoComanda como aplicativo. Aproveite!
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="mt-6 w-full"
              style={{ height: 52 }}
            >
              Abrir o app
            </Button>
          </div>
        ) : (
          <>
            {/* Banner principal de instalação (Android nativo / iOS instruções) */}
            {(platform === "android" || platform === "ios") && (
              <InstallBanner forceShow hideDismiss />
            )}

            {/* Card por plataforma */}
            {platform === "android" && <AndroidCard />}
            {platform === "ios" && <IOSCard />}
            {platform === "desktop" && <DesktopCard installUrl={installUrl} />}

            {/* Benefícios */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <BenefitCard
                icon={<Zap className="h-5 w-5 text-primary" />}
                label="Rápido"
              />
              <BenefitCard
                icon={<WifiOff className="h-5 w-5 text-primary" />}
                label="Offline"
              />
              <BenefitCard
                icon={<Bell className="h-5 w-5 text-primary" />}
                label="Notificações"
              />
            </div>

            <div className="mt-6 text-center">
              <a
                href="/auth"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Já tem conta? Entrar →
              </a>
            </div>
          </>
        )}

        {/* Footer FCIA */}
        <div className="mt-10 flex flex-col items-center gap-1 text-center">
          <p className="text-xs text-muted-foreground">Um produto</p>
          <div className="flex items-center gap-2">
            <img src={fciaLogo} alt="FCIA" className="h-8 w-8 rounded-md object-contain" />
            <span className="text-xl font-bold" style={{ color: "#22c55e" }}>FCIA</span>
          </div>
          <p className="text-xs text-muted-foreground">Soluções Inteligentes</p>
        </div>
      </div>
    </div>
  );
}

function AndroidCard() {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-xl">
      <div className="mb-4 flex items-center gap-2 text-foreground">
        <Smartphone className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Como instalar no Android</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Se o botão acima não abrir o instalador automaticamente, faça assim no
        Chrome:
      </p>
      <ol className="space-y-3">
        <Step n={1}>
          Toque no menu{" "}
          <MoreVertical className="inline h-4 w-4 align-text-bottom text-primary" />{" "}
          <strong>(3 pontinhos)</strong> no canto superior direito do navegador
        </Step>
        <Step n={2}>
          Escolha <strong>"Instalar app"</strong> ou{" "}
          <strong>"Adicionar à tela inicial"</strong>
        </Step>
        <Step n={3}>
          Confirme tocando em <strong>"Instalar"</strong>
        </Step>
      </ol>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        💡 Funciona no <strong>Chrome</strong>, <strong>Edge</strong> e{" "}
        <strong>Samsung Internet</strong>.
      </p>
    </div>
  );
}

function IOSCard() {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-xl">
      <div className="mb-4 flex items-center gap-2 text-foreground">
        <Apple className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Como instalar no iPhone</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        No <strong>Safari</strong> (não funciona no Chrome do iPhone):
      </p>
      <ol className="space-y-3">
        <Step n={1}>
          Toque no botão{" "}
          <Share className="inline h-4 w-4 align-text-bottom text-primary" />{" "}
          <strong>Compartilhar</strong> na barra inferior
        </Step>
        <Step n={2}>
          Role para baixo e escolha{" "}
          <Plus className="inline h-4 w-4 align-text-bottom text-primary" />{" "}
          <strong>Adicionar à Tela de Início</strong>
        </Step>
        <Step n={3}>
          Toque em <strong>"Adicionar"</strong> no canto superior direito
        </Step>
      </ol>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        ⚠️ No iPhone só dá pra instalar pelo <strong>Safari</strong>.
      </p>
    </div>
  );
}

function DesktopCard({ installUrl }: { installUrl: string }) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-xl">
      <div className="mb-4 flex items-center gap-2 text-foreground">
        <Monitor className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Abra no seu celular</h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        O FluxoComanda foi feito pra usar no celular. Aponte a câmera do seu
        smartphone para o QR Code abaixo:
      </p>

      <div className="mx-auto mb-5 w-fit rounded-xl bg-white p-4">
        <QRCodeSVG value={installUrl} size={180} level="M" />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Ou copie este link e abra no celular:
      </p>
      <div className="mt-2 flex items-center gap-2 rounded-xl bg-background p-2">
        <code className="flex-1 truncate px-2 text-xs text-foreground">
          {installUrl}
        </code>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(installUrl);
          }}
        >
          Copiar
        </Button>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Também dá para instalar no desktop: clique no ícone{" "}
        <span className="rounded bg-background px-1.5 py-0.5 font-mono">⊕</span>{" "}
        na barra de endereço do Chrome/Edge.
      </p>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-xl bg-background p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {n}
      </span>
      <span className="flex-1 pt-0.5 text-sm text-foreground">{children}</span>
    </li>
  );
}

function BenefitCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-card p-3 text-center">
      {icon}
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  );
}
