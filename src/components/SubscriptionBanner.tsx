import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { buildWhatsappLink } from "@/lib/subscriptionConfig";

export const SubscriptionBanner = () => {
  const { status, daysLeft, source, loading } = useSubscription();

  if (loading) return null;
  // Mostrar quando faltam 1 dia ou menos (e ainda não venceu)
  if (status === "expired") return null;
  if (daysLeft > 1) return null;

  const labelPeriodo = source === "trial" ? "Seu período de teste" : "Sua assinatura";
  const dias = daysLeft <= 0 ? "menos de 1 dia" : daysLeft === 1 ? "1 dia" : `${daysLeft} dias`;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-100">
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-medium">
          {labelPeriodo} {source === "trial" ? "termina" : "vence"} em {dias}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2 h-8 border-yellow-500/40 bg-yellow-500/20 text-yellow-50 hover:bg-yellow-500/30 hover:text-yellow-50"
          onClick={() => window.open(buildWhatsappLink(), "_blank", "noopener,noreferrer")}
        >
          Renovar
        </Button>
      </div>
    </div>
  );
};
