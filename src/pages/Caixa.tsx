import { useEffect, useState, useCallback } from "react";
import { Banknote, Smartphone, CreditCard, DollarSign, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

interface SaleRow {
  id: string;
  total: number;
  payment_method: string | null;
  created_at: string;
  order_id: string | null;
  customer_name?: string | null;
}

interface ClosureRow {
  id: string;
  closed_at: string;
  business_day: string;
  type: "manual" | "auto";
  closed_by_name: string | null;
  total: number;
}

const paymentIcon = (m: string | null) => {
  if (m === "dinheiro") return <Banknote className="h-4 w-4" />;
  if (m === "pix") return <Smartphone className="h-4 w-4" />;
  if (m === "cartao") return <CreditCard className="h-4 w-4" />;
  return null;
};

const paymentLabel = (m: string | null) => {
  if (m === "dinheiro") return "Dinheiro";
  if (m === "pix") return "PIX";
  if (m === "cartao") return "Cartão";
  return "—";
};

// YYYY-MM-DD em horário local
const toBusinessDay = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function Caixa() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [todayClosure, setTodayClosure] = useState<ClosureRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const todayBd = toBusinessDay(new Date());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // 1) Busca o fechamento de hoje primeiro — define o "ponto de corte"
    const closureRes = await supabase
      .from("cash_closures")
      .select("id, closed_at, business_day, type, closed_by_name, total")
      .eq("user_id", user.id)
      .eq("business_day", todayBd)
      .maybeSingle();

    const closure = (closureRes.data as ClosureRow | null) ?? null;
    if (closureRes.error) {
      console.warn("cash_closures indisponível:", closureRes.error.message);
    }

    // Caixa fechado → mostra apenas vendas feitas APÓS o fechamento (zera visualmente)
    // Caixa aberto → mostra todas as vendas desde 00:00
    const fromISO = closure ? closure.closed_at : todayISO;

    const salesRes = await supabase
      .from("sales")
      .select("id, total, payment_method, created_at, order_id")
      .eq("user_id", user.id)
      .gt("created_at", fromISO)
      .order("created_at", { ascending: false });

    const rows = (salesRes.data ?? []) as SaleRow[];

    const orderIds = rows.map((s) => s.order_id).filter((x): x is string => !!x);
    let nameMap = new Map<string, string | null>();
    if (orderIds.length > 0) {
      const ordersRes = await supabase
        .from("orders")
        .select("id, customer_name")
        .in("id", orderIds);
      const orders = (ordersRes.data ?? []) as { id: string; customer_name: string | null }[];
      nameMap = new Map(orders.map((o) => [o.id, o.customer_name]));
    }

    setSales(rows.map((s) => ({ ...s, customer_name: s.order_id ? nameMap.get(s.order_id) ?? null : null })));
    setTodayClosure(closure);
    setLoading(false);
  }, [user, todayBd]);

  // Auto-fechar dias anteriores que tenham vendas mas não tenham fechamento
  const autoCloseOldDays = useCallback(async () => {
    if (!user) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const oldSalesRes = await supabase
      .from("sales")
      .select("total, payment_method, created_at")
      .eq("user_id", user.id)
      .lt("created_at", todayISO);

    const oldSales = oldSalesRes.data ?? [];
    if (oldSales.length === 0) return;

    // Agrupa por business_day local
    const byDay = new Map<string, typeof oldSales>();
    for (const s of oldSales) {
      const bd = toBusinessDay(new Date(s.created_at));
      if (!byDay.has(bd)) byDay.set(bd, []);
      byDay.get(bd)!.push(s);
    }

    const days = Array.from(byDay.keys());
    const existingRes = await supabase
      .from("cash_closures")
      .select("business_day")
      .eq("user_id", user.id)
      .in("business_day", days);

    const existing = new Set((existingRes.data ?? []).map((r) => r.business_day));
    const toCreate = days.filter((d) => !existing.has(d));
    if (toCreate.length === 0) return;

    const rows = toCreate.map((bd) => {
      const list = byDay.get(bd)!;
      const total = list.reduce((a, s) => a + Number(s.total ?? 0), 0);
      const sum = (m: string) =>
        list.filter((s) => s.payment_method === m).reduce((a, s) => a + Number(s.total ?? 0), 0);
      // closed_at = fim do dia local
      const closedAt = new Date(`${bd}T23:59:59`);
      return {
        user_id: user.id,
        business_day: bd,
        type: "auto" as const,
        closed_by_name: null,
        closed_at: closedAt.toISOString(),
        total,
        total_dinheiro: sum("dinheiro"),
        total_pix: sum("pix"),
        total_cartao: sum("cartao"),
        sales_count: list.length,
      };
    });

    await supabase.from("cash_closures").insert(rows);
  }, [user]);

  useEffect(() => {
    (async () => {
      await autoCloseOldDays();
      await load();
    })();
  }, [autoCloseOldDays, load]);

  const totalDia = sales.reduce((acc, s) => acc + Number(s.total ?? 0), 0);
  const totalDinheiro = sales.filter((s) => s.payment_method === "dinheiro").reduce((a, s) => a + Number(s.total ?? 0), 0);
  const totalPix = sales.filter((s) => s.payment_method === "pix").reduce((a, s) => a + Number(s.total ?? 0), 0);
  const totalCartao = sales.filter((s) => s.payment_method === "cartao").reduce((a, s) => a + Number(s.total ?? 0), 0);

  const handleClose = async () => {
    if (!user) return;
    setClosing(true);

    // Buscar nome do usuário no profile
    const profRes = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    const closedByName = profRes.data?.name || user.email || "Operador";

    const { error } = await supabase.from("cash_closures").insert({
      user_id: user.id,
      business_day: todayBd,
      type: "manual",
      closed_by_name: closedByName,
      total: totalDia,
      total_dinheiro: totalDinheiro,
      total_pix: totalPix,
      total_cartao: totalCartao,
      sales_count: sales.length,
    });

    setClosing(false);
    setConfirmOpen(false);

    if (error) {
      toast.error("Erro ao fechar caixa: " + error.message);
      return;
    }

    toast.success("Caixa fechado com sucesso!");
    await load();
  };

  const today = new Date();
  const dataFmt = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(today);

  const isClosed = !!todayClosure;

  return (
    <AppShell>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Caixa do Dia</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{dataFmt}</p>
        </div>
        {isClosed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Lock className="h-3 w-3" />
            Caixa Fechado
          </span>
        )}
      </header>

      {/* Total do dia (destaque) */}
      <div className="mb-3 rounded-2xl bg-card p-5">
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          <span className="text-xs font-medium">Total do Dia</span>
        </div>
        {loading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <p className="text-3xl font-bold text-primary">{brl.format(totalDia)}</p>
        )}
      </div>

      {/* Cards por forma de pagamento */}
      <section className="mb-4 grid grid-cols-3 gap-2">
        <PaymentCard icon={<Banknote className="h-4 w-4" />} label="Dinheiro" value={totalDinheiro} loading={loading} />
        <PaymentCard icon={<Smartphone className="h-4 w-4" />} label="PIX" value={totalPix} loading={loading} />
        <PaymentCard icon={<CreditCard className="h-4 w-4" />} label="Cartão" value={totalCartao} loading={loading} />
      </section>

      {/* Status / Botão fechar */}
      {!loading && (
        <div className="mb-6">
          {isClosed ? (
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {todayClosure!.type === "manual"
                    ? `Fechado manualmente por ${todayClosure!.closed_by_name ?? "—"}`
                    : "Fechamento automático"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  às {time.format(new Date(todayClosure!.closed_at))}
                </p>
              </div>
            </div>
          ) : (
            <Button
              variant="destructive"
              className="h-12 w-full text-base font-semibold"
              disabled={sales.length === 0}
              onClick={() => setConfirmOpen(true)}
            >
              <Lock className="mr-2 h-4 w-4" />
              Fechar Caixa
            </Button>
          )}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Vendas de hoje
      </h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">Nenhuma venda registrada hoje 📭</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sales.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {s.customer_name || "Sem nome"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {paymentIcon(s.payment_method)}
                  <span>{paymentLabel(s.payment_method)}</span>
                  <span>•</span>
                  <span>{time.format(new Date(s.created_at))}</span>
                </div>
              </div>
              <p className="whitespace-nowrap text-base font-bold text-foreground">
                {brl.format(Number(s.total))}
              </p>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar caixa agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja fechar o caixa agora? Essa ação vai encerrar
              todas as operações do dia e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleClose();
              }}
              disabled={closing}
            >
              {closing ? "Fechando…" : "Sim, fechar caixa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function PaymentCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-5 w-16" />
      ) : (
        <p className="text-sm font-bold text-foreground">{brl.format(value)}</p>
      )}
    </div>
  );
}
