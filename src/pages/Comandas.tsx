import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Banknote, Smartphone, CreditCard, Clock, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

interface Order {
  id: string;
  customer_name: string | null;
  status: string;
  total: number;
  payment_method: string | null;
  created_at: string;
  closed_at: string | null;
  guardada_em: string | null;
  guardada_obs: string | null;
}

interface OrderItemMini {
  order_id: string;
  product_name: string;
  quantity: number;
}

const paymentIcon = (m: string | null) => {
  if (m === "dinheiro") return <Banknote className="h-4 w-4" />;
  if (m === "pix") return <Smartphone className="h-4 w-4" />;
  if (m === "cartao") return <CreditCard className="h-4 w-4" />;
  return null;
};

type PaymentMethod = "dinheiro" | "pix" | "cartao";

function diasPendente(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  return d;
}

export default function Comandas() {
  const { user } = useAuth();
  const { effectiveUserId } = useProfile();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"open" | "guardadas" | "closed">("open");
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [guardadasOrders, setGuardadasOrders] = useState<Order[]>([]);
  const [closedOrders, setClosedOrders] = useState<Order[]>([]);
  const [guardadasItems, setGuardadasItems] = useState<Record<string, OrderItemMini[]>>({});
  const [loading, setLoading] = useState(true);

  // Receber pagamento
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    if (!user || !effectiveUserId) return;
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [openRes, guardadasRes, closedRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, customer_name, status, total, payment_method, created_at, closed_at, guardada_em, guardada_obs")
        .eq("user_id", effectiveUserId)
        .eq("status", "open")
        .order("created_at", { ascending: false }) as any,
      supabase
        .from("orders")
        .select("id, customer_name, status, total, payment_method, created_at, closed_at, guardada_em, guardada_obs")
        .eq("user_id", effectiveUserId)
        .eq("status", "guardada")
        .order("guardada_em" as any, { ascending: true }) as any,
      supabase
        .from("orders")
        .select("id, customer_name, status, total, payment_method, created_at, closed_at, guardada_em, guardada_obs")
        .eq("user_id", effectiveUserId)
        .eq("status", "closed")
        .gte("closed_at", todayISO)
        .order("closed_at", { ascending: false }) as any,
    ]);
    if (openRes.error || guardadasRes.error || closedRes.error) {
      toast.error("Erro ao carregar comandas");
      setLoading(false);
      return;
    }
    const guardadas = (guardadasRes.data ?? []) as unknown as Order[];
    setOpenOrders((openRes.data ?? []) as unknown as Order[]);
    setGuardadasOrders(guardadas);
    setClosedOrders((closedRes.data ?? []) as unknown as Order[]);

    // Buscar itens das guardadas
    if (guardadas.length > 0) {
      const itemsRes = await supabase
        .from("order_items")
        .select("order_id, product_name, quantity")
        .in("order_id", guardadas.map((g) => g.id));
      if (!itemsRes.error) {
        const map: Record<string, OrderItemMini[]> = {};
        (itemsRes.data ?? []).forEach((it) => {
          const k = (it as OrderItemMini).order_id;
          (map[k] ??= []).push(it as OrderItemMini);
        });
        setGuardadasItems(map);
      }
    } else {
      setGuardadasItems({});
    }
    setLoading(false);
  }, [user, effectiveUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPendente = useMemo(
    () => guardadasOrders.reduce((acc, o) => acc + Number(o.total ?? 0), 0),
    [guardadasOrders]
  );

  const openPayDialog = (o: Order) => {
    setPayOrder(o);
    setPayment(null);
  };

  const confirmPay = async () => {
    if (!payOrder || !payment) return;
    setPaying(true);
    const { error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>)(
      "fechar_comanda",
      { p_order_id: payOrder.id, p_payment_method: payment }
    );
    setPaying(false);
    if (error) {
      toast.error(error.message || "Erro ao receber pagamento");
      return;
    }
    toast.success(`✅ Pagamento de ${brl.format(Number(payOrder.total))} recebido!`);
    setPayOrder(null);
    load();
  };

  return (
    <AppShell>
      <PageHeader title="Comandas" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="open">Abertas</TabsTrigger>
          <TabsTrigger value="guardadas">
            Guardadas
            {guardadasOrders.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {guardadasOrders.length}
              </span>
            )}
          </TabsTrigger>
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

        <TabsContent value="guardadas" className="mt-4">
          {loading ? (
            <ListSkeleton />
          ) : guardadasOrders.length === 0 ? (
            <EmptyState message="Nenhuma venda guardada" />
          ) : (
            <>
              <ul className="space-y-3 pb-24">
                {guardadasOrders.map((o) => {
                  const items = guardadasItems[o.id] ?? [];
                  const dias = o.guardada_em ? diasPendente(o.guardada_em) : 0;
                  return (
                    <li key={o.id} className="rounded-2xl bg-card p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-foreground">
                            {o.customer_name || "Sem nome"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            {o.guardada_em && (
                              <span>Guardada em {dateFmt.format(new Date(o.guardada_em))}</span>
                            )}
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                dias >= 7
                                  ? "bg-destructive/15 text-destructive"
                                  : dias >= 3
                                    ? "bg-primary/15 text-primary"
                                    : "bg-muted text-muted-foreground"
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              {dias === 0 ? "hoje" : dias === 1 ? "1 dia" : `${dias} dias`}
                            </span>
                          </div>
                        </div>
                        <p className="whitespace-nowrap text-lg font-bold text-primary">
                          {brl.format(Number(o.total))}
                        </p>
                      </div>

                      {items.length > 0 && (
                        <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                          {items.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}
                        </p>
                      )}

                      {o.guardada_obs && (
                        <p className="mb-3 rounded-lg bg-muted/40 p-2 text-xs italic text-muted-foreground">
                          “{o.guardada_obs}”
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="h-11"
                          onClick={() => navigate(`/comandas/${o.id}`)}
                        >
                          Ver
                        </Button>
                        <Button
                          className="h-11"
                          onClick={() => openPayDialog(o)}
                        >
                          <Wallet className="h-4 w-4" />
                          Receber
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Rodapé total pendente */}
              <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-background px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                <div className="mx-auto flex max-w-md items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total pendente
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {brl.format(totalPendente)}
                  </span>
                </div>
              </div>
            </>
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

      {/* Dialog Receber Pagamento */}
      <Dialog open={!!payOrder} onOpenChange={(o) => !o && setPayOrder(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Receber pagamento</DialogTitle>
          </DialogHeader>
          {payOrder && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="text-base font-semibold text-foreground">
                  {payOrder.customer_name || "Sem nome"}
                </p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {brl.format(Number(payOrder.total))}
                  </span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Forma de pagamento
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <PayBtn
                    active={payment === "dinheiro"}
                    onClick={() => setPayment("dinheiro")}
                    icon={<Banknote className="h-5 w-5" />}
                    label="Dinheiro"
                  />
                  <PayBtn
                    active={payment === "pix"}
                    onClick={() => setPayment("pix")}
                    icon={<Smartphone className="h-5 w-5" />}
                    label="PIX"
                  />
                  <PayBtn
                    active={payment === "cartao"}
                    onClick={() => setPayment("cartao")}
                    icon={<CreditCard className="h-5 w-5" />}
                    label="Cartão"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setPayOrder(null)} disabled={paying}>
              Cancelar
            </Button>
            <Button onClick={confirmPay} disabled={!payment || paying}>
              {paying ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function PayBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
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
