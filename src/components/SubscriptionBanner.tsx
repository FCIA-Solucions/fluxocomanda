import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { buildWhatsappLink } from "@/lib/subscriptionConfig";

export const SubscriptionBanner = () => {
  const { status, daysLeft, loading } = useSubscription();

  if (loading) return null;
  if (status === "expired") return null;

  // Trial: avisa quando faltam 1 dia ou menos
  // Active: avisa quando faltam 7 dias ou menos
  const shouldShow =
    (status === "trial" && daysLeft <= 1) || (status === "active" && daysLeft <= 7);
  if (!shouldShow) return null;

  let message = "";
  if (status === "trial") {
    message = daysLeft <= 1 ? "⚠️ Seu teste termina amanhã!" : `⚠️ Seu teste termina em ${daysLeft} dias`;
  } else {
    message =
      daysLeft <= 1
        ? "⚠️ Sua assinatura vence amanhã!"
        : `⚠️ Sua assinatura vence em ${daysLeft} dias`;
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-100">
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2 h-8 border-yellow-500/40 bg-yellow-500/20 text-yellow-50 hover:bg-yellow-500/30 hover:text-yellow-50"
          onClick={() => window.open(buildWhatsappLink(), "_blank", "noopener,noreferrer")}
        >
          Renovar →
        </Button>
      </div>
    </div>
  );
};
