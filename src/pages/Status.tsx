import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Shield, Mail, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { ADMIN_EMAIL } from "@/lib/subscriptionConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const Status = () => {
  const { user } = useAuth();
  const sub = useSubscription();

  const userEmail = user?.email ?? "—";
  const isAdmin =
    !!ADMIN_EMAIL &&
    !!user?.email &&
    user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const statusLabel = sub.status === "trial" ? "Trial" : sub.status === "active" ? "Ativa" : "Vencida";
  const statusColor =
    sub.status === "active"
      ? "bg-green-500/15 text-green-300 border-green-500/30"
      : sub.status === "trial"
        ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
        : "bg-red-500/15 text-red-300 border-red-500/30";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Status da conta</h1>
        </div>

        {/* Bypass admin */}
        <Card className={isAdmin ? "border-green-500/40" : "border-yellow-500/40"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" /> Acesso de administrador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              {isAdmin ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-400" />
              ) : (
                <XCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-yellow-400" />
              )}
              <div className="flex-1">
                <p className="font-semibold">
                  {isAdmin
                    ? "Você está LIVRE de bloqueio de assinatura"
                    : "Sem bypass de admin"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isAdmin
                    ? "Mesmo com assinatura vencida, você continua acessando todo o sistema."
                    : "Seu e-mail não corresponde ao admin configurado. As regras normais de assinatura se aplicam."}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> Seu e-mail
                </span>
                <span className="font-mono text-xs break-all text-right">{userEmail}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" /> Admin configurado
                </span>
                <span className="font-mono text-xs break-all text-right">{ADMIN_EMAIL || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assinatura / Trial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Assinatura
              </span>
              <Badge variant="outline" className={statusColor}>
                {statusLabel}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sub.loading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : (
              <>
                <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {sub.source === "active"
                      ? "Dias restantes da assinatura"
                      : sub.source === "trial"
                        ? "Dias restantes do trial"
                        : "Status"}
                  </p>
                  <p className="mt-1 text-4xl font-bold">
                    {sub.status === "expired" ? "Vencido" : `${sub.daysLeft} ${sub.daysLeft === 1 ? "dia" : "dias"}`}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" /> Trial termina em
                    </span>
                    <span className="font-mono text-xs">{fmtDate(sub.trialEndsAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" /> Assinatura expira em
                    </span>
                    <span className="font-mono text-xs">{fmtDate(sub.subscriptionExpiresAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-4 w-4" /> App bloqueado
                    </span>
                    <span className="font-mono text-xs">
                      {sub.isBlocked ? "Sim" : "Não"}
                    </span>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <button onClick={() => sub.refresh()}>Atualizar dados</button>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Status;
