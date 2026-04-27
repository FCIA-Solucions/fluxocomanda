import { useState } from "react";
import { Copy, Check, MessageCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  PIX_KEY,
  SUBSCRIPTION_PRICE_BRL,
  WHATSAPP_NUMBER,
  buildWhatsappLink,
} from "@/lib/subscriptionConfig";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function Assinatura() {
  const { signOut } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyPix = async () => {
    if (!PIX_KEY) {
      toast.error("Chave PIX ainda não configurada");
      return;
    }
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      toast.success("Chave PIX copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const openWhatsapp = () => {
    const msg = `Olá! Acabei de fazer o pagamento da assinatura do FluxoComanda (${brl.format(
      SUBSCRIPTION_PRICE_BRL
    )}). Segue o comprovante.`;
    window.open(buildWhatsappLink(msg), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Sua assinatura venceu 😕</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Para continuar usando o FluxoComanda, renove sua assinatura.
          </p>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-xl">
          <div className="mb-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mensalidade</p>
            <p className="text-3xl font-bold text-primary">
              {brl.format(SUBSCRIPTION_PRICE_BRL)}
              <span className="ml-1 text-base font-normal text-muted-foreground">/mês</span>
            </p>
          </div>

          <div className="mb-4 rounded-xl bg-background p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Pague via PIX
            </p>
            <p className="break-all text-base font-mono font-semibold">
              {PIX_KEY || "Chave PIX não configurada"}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              onClick={copyPix}
              disabled={!PIX_KEY}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copiada
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar chave PIX
                </>
              )}
            </Button>
          </div>

          <p className="mb-4 text-center text-sm text-muted-foreground">
            Após o pagamento, envie o comprovante para
            {WHATSAPP_NUMBER ? (
              <>
                {" "}
                <span className="font-semibold text-foreground">{WHATSAPP_NUMBER}</span>
              </>
            ) : (
              " nosso WhatsApp"
            )}
            .
          </p>

          <Button
            type="button"
            onClick={openWhatsapp}
            className="h-14 w-full text-base font-semibold"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Enviar comprovante
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={signOut}
          className="mx-auto mt-6 block text-sm text-muted-foreground"
        >
          Sair da conta
        </Button>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          FluxoComanda é um produto{" "}
          <a
            href="https://fcia.lovable.app/desenvolvimento"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            by <span className="font-semibold" style={{ color: "#22c55e" }}>FCIA</span> - Soluções em Tecnologia
          </a>
        </p>
      </div>
    </div>
  );
}
