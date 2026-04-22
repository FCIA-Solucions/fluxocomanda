import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, DollarSign, ClipboardList, CheckCircle2, Receipt, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InstallBanner } from "@/components/InstallBanner";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface Metrics {
  vendasHoje: number;
  comandasAbertas: number;
  comandasFechadasHoje: number;
  ticketMedio: number;
  qtdVendasHoje: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { business } = useBusiness();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics>({
    vendasHoje: 0,
    comandasAbertas: 0,
    comandasFechadasHoje: 0,
    ticketMedio: 0,
    qtdVendasHoje: 0,
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
      .then((res) => {
        const data = res.data as { name: string | null } | null;
        setName(data?.name ?? user.email?.split("@")[0] ?? "");
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const load = async () => {
      setLoading(true);
      const [salesRes, openRes, closedRes] = await Promise.all([
        supabase
          .from("sales")
          .select("total")
          .eq("user_id", user.id)
          .gte("created_at", todayISO),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "open"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "closed")
          .gte("closed_at", todayISO),
      ]);

      const sales = (salesRes.data ?? []) as { total: number }[];
      const totalHoje = sales.reduce((acc, s) => acc + Number(s.total ?? 0), 0);
      const qtd = sales.length;

      setMetrics({
        vendasHoje: totalHoje,
        comandasAbertas: openRes.count ?? 0,
        comandasFechadasHoje: closedRes.count ?? 0,
        ticketMedio: qtd > 0 ? totalHoje / qtd : 0,
        qtdVendasHoje: qtd,
      });
      setLoading(false);
    };

    load();
  }, [user]);

  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {business.logo_url && (
            <img
              src={business.logo_url}
              alt={business.business_name ?? "Logo"}
              className="h-12 w-12 rounded-xl bg-card object-contain"
            />
          )}
          <div>
            <p className="text-sm text-muted-foreground">Olá, {name || "..."} 👋</p>
            <h1 className="text-2xl font-bold text-foreground">
              {business.business_name?.trim() || "FluxoComanda"}
            </h1>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair" className="min-h-touch min-w-touch">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <SubscriptionBanner />
      <InstallBanner />

      <section className="mb-6 grid grid-cols-2 gap-3">
        <MetricCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Vendas Hoje"
          value={brl.format(metrics.vendasHoje)}
          loading={loading}
        />
        <MetricCard
          icon={<ClipboardList className="h-4 w-4" />}
          label="Comandas Abertas"
          value={String(metrics.comandasAbertas)}
          loading={loading}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Fechadas Hoje"
          value={String(metrics.comandasFechadasHoje)}
          loading={loading}
        />
        <MetricCard
          icon={<Receipt className="h-4 w-4" />}
          label="Ticket Médio"
          value={brl.format(metrics.ticketMedio)}
          loading={loading}
        />
      </section>

      {!loading && metrics.qtdVendasHoje === 0 && (
        <p className="mb-4 text-center text-sm text-muted-foreground">Nenhuma venda hoje ainda 🙂</p>
      )}

      <div className="space-y-3">
        <Button
          onClick={() => navigate("/comandas")}
          className="h-16 w-full text-base font-semibold"
        >
          <Plus className="mr-1 h-5 w-5" />
          Nova Comanda
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/comandas")}
          className="h-12 w-full"
        >
          Ver Comandas
        </Button>
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-20" />
      ) : (
        <p className="text-xl font-bold text-foreground">{value}</p>
      )}
    </div>
  );
}
