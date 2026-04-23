import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Banknote, Smartphone, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

interface Order {
  id: string;
  customer_name: string | null;
  status: string;
  total: number;
  payment_method: string | null;
  created_at: string;
  closed_at: string | null;
}

const paymentIcon = (m: string | null) => {
  if (m === "dinheiro") return <Banknote className="h-4 w-4" />;
  if (m === "pix") return <Smartphone className="h-4 w-4" />;
  if (m === "cartao") return <CreditCard className="h-4 w-4" />;
  return null;
};

export default function Comandas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [closedOrders, setClosedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [openRes, closedRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, customer_name, status, total, payment_method, created_at, closed_at")
        .eq("user_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id, customer_name, status, total, payment_method, created_at, closed_at")
        .eq("user_id", user.id)
        .eq("status", "closed")
        .gte("closed_at", todayISO)
        .order("closed_at", { ascending: false }),
    ]);
    if (openRes.error || closedRes.error) {
      toast.error("Erro ao carregar comandas");
    } else {
      setOpenOrders((openRes.data ?? []) as Order[]);
      setClosedOrders((closedRes.data ?? []) as Order[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-bold text-foreground">Comandas</h1>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "open" | "closed")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="open">Abertas</TabsTrigger>
          <TabsTrigger value="closed">Fechadas hoje</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4">
          {loading ? (
            <ListSkeleton />
          ) : openOrders.length === 0 ? (
            <EmptyState message="Nenhuma comanda aberta" />
          ) : (
            <ul className="space-y-3">
              {openOrders.map((o) => (
                <li key={o.id} className="rounded-2xl bg-card p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-foreground">
                        {o.customer_name || "Sem nome"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Aberta às {time.format(new Date(o.created_at))}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-lg font-bold text-primary">
                      {brl.format(Number(o.total))}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="h-11 w-full"
                    onClick={() => navigate(`/comandas/${o.id}`)}
                  >
                    Ver comanda
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="closed" className="mt-4">
          {loading ? (
            <ListSkeleton />
          ) : closedOrders.length === 0 ? (
            <EmptyState message="Nenhuma venda hoje" />
          ) : (
            <ul className="space-y-3">
              {closedOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground">
                      {o.customer_name || "Sem nome"}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {paymentIcon(o.payment_method)}
                      <span>
                        {o.closed_at ? time.format(new Date(o.closed_at)) : ""}
                      </span>
                    </div>
                  </div>
                  <p className="whitespace-nowrap text-base font-bold text-foreground">
                    {brl.format(Number(o.total))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {/* FAB */}
      <button
        onClick={() => navigate("/comandas/nova")}
        aria-label="Nova comanda"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>
    </AppShell>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-16 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
