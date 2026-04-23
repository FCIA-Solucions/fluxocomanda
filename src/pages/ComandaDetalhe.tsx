import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Trash2, Banknote, Smartphone, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface Order {
  id: string;
  user_id: string;
  customer_name: string | null;
  status: string;
  total: number;
  payment_method: string | null;
}

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

type PaymentMethod = "dinheiro" | "pix" | "cartao";

export default function ComandaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [confirming, setConfirming] = useState(false);

  const isClosed = order?.status === "closed";

  const total = useMemo(
    () => items.reduce((acc, i) => acc + Number(i.subtotal ?? 0), 0),
    [items]
  );

  const load = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    const [orderRes, itemsRes, productsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, user_id, customer_name, status, total, payment_method")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("order_items")
        .select("id, product_id, product_name, quantity, unit_price, subtotal")
        .eq("order_id", id)
        .order("id", { ascending: true }),
      supabase
        .from("products")
        .select("id, name, price")
        .eq("user_id", user.id)
        .eq("active", true)
        .order("name", { ascending: true }),
    ]);
    if (orderRes.error || !orderRes.data) {
      toast.error("Comanda não encontrada");
      navigate("/comandas", { replace: true });
      return;
    }
    setOrder(orderRes.data as Order);
    setItems((itemsRes.data ?? []) as OrderItem[]);
    setProducts((productsRes.data ?? []) as Product[]);
    setLoading(false);
  }, [user, id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // Abre sheet de fechamento via ?fechar=1
  useEffect(() => {
    if (!loading && order && !isClosed && searchParams.get("fechar") === "1" && items.length > 0) {
      setCloseOpen(true);
    }
  }, [loading, order, isClosed, items.length, searchParams]);

  const persistTotal = async (newItems: OrderItem[]) => {
    if (!id) return;
    const newTotal = newItems.reduce((acc, i) => acc + Number(i.subtotal ?? 0), 0);
    await supabase.from("orders").update({ total: newTotal }).eq("id", id);
    setOrder((prev) => (prev ? { ...prev, total: newTotal } : prev));
  };

  const addProduct = async (p: Product) => {
    if (!order || isClosed) return;
    setHighlightId(p.id);
    setTimeout(() => setHighlightId(null), 250);

    const existing = items.find((i) => i.product_id === p.id);
    if (existing) {
      const newQty = existing.quantity + 1;
      const newSub = Number((newQty * Number(existing.unit_price)).toFixed(2));
      const { error } = await supabase
        .from("order_items")
        .update({ quantity: newQty, subtotal: newSub })
        .eq("id", existing.id);
      if (error) {
        toast.error("Erro ao adicionar item");
        return;
      }
      const next = items.map((i) => (i.id === existing.id ? { ...i, quantity: newQty, subtotal: newSub } : i));
      setItems(next);
      persistTotal(next);
    } else {
      const sub = Number(Number(p.price).toFixed(2));
      const { data, error } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: p.id,
          product_name: p.name,
          quantity: 1,
          unit_price: sub,
          subtotal: sub,
        })
        .select("id, product_id, product_name, quantity, unit_price, subtotal")
        .single();
      if (error || !data) {
        toast.error("Erro ao adicionar item");
        return;
      }
      const next = [...items, data as OrderItem];
      setItems(next);
      persistTotal(next);
    }
  };

  const changeQty = async (item: OrderItem, delta: number) => {
    if (isClosed) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeItem(item);
      return;
    }
    const newSub = Number((newQty * Number(item.unit_price)).toFixed(2));
    const { error } = await supabase
      .from("order_items")
      .update({ quantity: newQty, subtotal: newSub })
      .eq("id", item.id);
    if (error) {
      toast.error("Erro ao atualizar");
      return;
    }
    const next = items.map((i) => (i.id === item.id ? { ...i, quantity: newQty, subtotal: newSub } : i));
    setItems(next);
    persistTotal(next);
  };

  const removeItem = async (item: OrderItem) => {
    if (isClosed) return;
    const { error } = await supabase.from("order_items").delete().eq("id", item.id);
    if (error) {
      toast.error("Erro ao remover");
      return;
    }
    const next = items.filter((i) => i.id !== item.id);
    setItems(next);
    persistTotal(next);
  };

  const openCloseSheet = () => {
    if (items.length === 0) {
      toast.error("Adicione ao menos 1 item");
      return;
    }
    setPayment(null);
    setCloseOpen(true);
  };

  const closeSheetAndCleanUrl = (open: boolean) => {
    setCloseOpen(open);
    if (!open && searchParams.get("fechar")) {
      searchParams.delete("fechar");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const confirmPayment = async () => {
    if (!order || !user || !payment) return;
    setConfirming(true);

    // Fechamento ATÔMICO via RPC: calcula total, registra venda e
    // fecha a comanda em uma única transação. Em caso de erro,
    // o Postgres faz rollback automático de tudo.
    const { data, error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: { total?: number } | null; error: { message: string } | null }>)(
      "fechar_comanda",
      { p_order_id: order.id, p_payment_method: payment }
    );

    setConfirming(false);

    if (error) {
      toast.error(error.message || "Erro ao fechar comanda");
      return;
    }

    const finalTotal = (data as { total?: number } | null)?.total ?? total;
    toast.success(`✅ Venda de ${brl.format(Number(finalTotal))} registrada!`);
    navigate("/dashboard", { replace: true });
  };

  if (loading) {
    return (
      <AppShell>
        <Skeleton className="mb-4 h-8 w-40" />
        <Skeleton className="mb-6 h-16 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </AppShell>
    );
  }

  if (!order) return null;

  return (
    <AppShell>
      <div className="pb-20">
        <button
          onClick={() => navigate("/comandas")}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <header className="mb-4 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">{order.customer_name || "Sem nome"}</h1>
          <Badge variant={isClosed ? "secondary" : "default"}>
            {isClosed ? "Fechada" : "Aberta"}
          </Badge>
        </header>

        <div className="mb-6 rounded-2xl bg-card p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 text-4xl font-bold text-primary">{brl.format(total)}</p>
        </div>

        {/* Itens */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Itens
          </h2>
          {items.length === 0 ? (
            <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
              Nenhum item. Adicione abaixo.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center gap-2 rounded-2xl bg-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{i.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {brl.format(Number(i.unit_price))} · {brl.format(Number(i.subtotal))}
                    </p>
                  </div>
                  {!isClosed && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        aria-label="Diminuir"
                        onClick={() => changeQty(i, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">
                        {i.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        aria-label="Aumentar"
                        onClick={() => changeQty(i, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        aria-label="Remover"
                        onClick={() => removeItem(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {isClosed && (
                    <span className="text-sm font-semibold tabular-nums">×{i.quantity}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Grid de produtos */}
        {!isClosed && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Adicionar produto
            </h2>
            {products.length === 0 ? (
              <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
                Nenhum produto ativo.{" "}
                <button
                  onClick={() => navigate("/produtos")}
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Cadastrar
                </button>
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addProduct(p)}
                    className={cn(
                      "rounded-2xl bg-card p-4 text-left transition-all active:scale-[0.97]",
                      highlightId === p.id && "ring-2 ring-primary bg-primary/10"
                    )}
                  >
                    <p className="line-clamp-2 text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="mt-1 text-sm font-bold text-primary">{brl.format(Number(p.price))}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Botão fixo Fechar Comanda */}
      {!isClosed && items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-background px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="mx-auto max-w-md">
            <Button
              onClick={openCloseSheet}
              variant="destructive"
              className="h-16 w-full text-base font-semibold"
            >
              Fechar Comanda →
            </Button>
          </div>
        </div>
      )}

      {/* Sheet de fechamento */}
      <Sheet open={closeOpen} onOpenChange={closeSheetAndCleanUrl}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Fechar comanda</SheetTitle>
          </SheetHeader>

          <div className="mt-4 max-h-40 space-y-1 overflow-y-auto rounded-xl bg-muted/40 p-3">
            {items.map((i) => (
              <div key={i.id} className="flex items-center justify-between text-sm">
                <span className="truncate pr-2">
                  {i.quantity}× {i.product_name}
                </span>
                <span className="tabular-nums text-muted-foreground">{brl.format(Number(i.subtotal))}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-3xl font-bold text-primary">{brl.format(total)}</span>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Forma de pagamento</p>
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

          <Button
            onClick={confirmPayment}
            disabled={!payment || confirming}
            className="mt-4 h-16 w-full text-base font-semibold"
          >
            {confirming ? "Processando..." : "Confirmar Pagamento"}
          </Button>
        </SheetContent>
      </Sheet>
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
