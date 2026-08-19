import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Trash2, Banknote, Smartphone, CreditCard, MessageCircle, Bookmark, Search, X, Printer } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { useProfile } from "@/hooks/useProfile";
import { ComandaPrint } from "@/components/print/ComandaPrint";
import { supabase } from "@/integrations/supabase/client";

function maskPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const paymentLabel: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao: "Cartão",
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface Order {
  id: string;
  user_id: string;
  customer_name: string | null;
  customer_id: string | null;
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

type Categoria = "bebidas" | "comidas" | "outros";

const CATEGORIA_LABEL: Record<Categoria, string> = {
  bebidas: "Bebidas",
  comidas: "Comidas",
  outros: "Outros",
};

const normalizeCategoria = (v: unknown): Categoria => {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "bebidas" || s === "bebida") return "bebidas";
  if (s === "comidas" || s === "comida") return "comidas";
  return "outros";
};

interface Product {
  id: string;
  name: string;
  price: number;
  categoria: Categoria;
}

type PaymentMethod = "dinheiro" | "pix" | "cartao";

export default function ComandaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { effectiveUserId, role } = useProfile();
  const isGarcom = role === "garcom";
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
  const [step, setStep] = useState<"payment" | "share">("payment");
  const [phone, setPhone] = useState("");
  const [customerInfo, setCustomerInfo] = useState<{ name?: string; whatsapp?: string } | null>(null);
  const [closedSnapshot, setClosedSnapshot] = useState<{
    items: OrderItem[];
    total: number;
    payment: PaymentMethod;
    closedAt: Date;
    customerName: string | null;
  } | null>(null);

  // Guardar venda
  const [guardarOpen, setGuardarOpen] = useState(false);
  const [guardarNome, setGuardarNome] = useState("");
  const [guardarObs, setGuardarObs] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Filtro de categoria no cardápio
  const [filterCat, setFilterCat] = useState<"all" | Categoria>("all");
  const [productSearch, setProductSearch] = useState("");

  const { business } = useBusiness();

  const isClosed = order?.status === "closed";
  const isGuardada = order?.status === "guardada";

  const total = useMemo(
    () => items.reduce((acc, i) => acc + Number(i.subtotal ?? 0), 0),
    [items]
  );

  const load = useCallback(async () => {
    if (!user || !id || !effectiveUserId) return;
    setLoading(true);
    const [orderRes, itemsRes, productsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, user_id, customer_name, customer_id, status, total, payment_method, guardada_obs")
        .eq("id", id)
        .eq("user_id", effectiveUserId)
        .maybeSingle(),
      supabase
        .from("order_items")
        .select("id, product_id, product_name, quantity, unit_price, subtotal")
        .eq("order_id", id)
        .order("id", { ascending: true }),
      supabase
        .from("products")
        .select("id, name, price, categoria")
        .eq("user_id", effectiveUserId)
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

    // Carregar dados do cliente se houver customer_id
    if (orderRes.data.customer_id) {
      const { data: cust } = await supabase
        .from("customers")
        .select("name, whatsapp")
        .eq("id", orderRes.data.customer_id)
        .maybeSingle();
      if (cust) setCustomerInfo(cust);
    }

    setProducts(
      (productsRes.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        categoria: normalizeCategoria(p.categoria),
      }))
    );
    setLoading(false);
  }, [user, id, navigate, effectiveUserId]);

  useEffect(() => {
    load();
  }, [load]);

  // Refetch products when the tab/window regains focus or becomes visible
  // (e.g. user volta da tela Produtos após cadastrar um novo item)
  const refetchProducts = useCallback(async () => {
    if (!effectiveUserId) return;
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, categoria")
      .eq("user_id", effectiveUserId)
      .eq("active", true)
      .order("name", { ascending: true });
    if (!error)
      setProducts(
        (data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          categoria: normalizeCategoria(p.categoria),
        }))
      );
  }, [effectiveUserId]);

  useEffect(() => {
    const onFocus = () => refetchProducts();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refetchProducts();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refetchProducts]);

  // Realtime: novos produtos cadastrados aparecem instantaneamente no cardápio
  useEffect(() => {
    if (!effectiveUserId) return;
    const channel = supabase
      .channel(`products-${effectiveUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products", filter: `user_id=eq.${effectiveUserId}` },
        () => refetchProducts()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveUserId, refetchProducts]);

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
    setStep("payment");
    setPhone("");
    setCloseOpen(true);
  };

  const postSaleRedirect = isGarcom ? "/comandas" : "/dashboard";

  const closeSheetAndCleanUrl = (open: boolean) => {
    setCloseOpen(open);
    if (!open && searchParams.get("fechar")) {
      searchParams.delete("fechar");
      setSearchParams(searchParams, { replace: true });
    }
    if (!open && closedSnapshot) {
      // Após fechar o modal pós-venda, voltar à tela inicial conforme role
      navigate(postSaleRedirect, { replace: true });
    }
  };

  const confirmPayment = async () => {
    if (!order || !user || !payment) return;
    setConfirming(true);

    const { data, error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: { total?: number; closed_at?: string } | null; error: { message: string } | null }>)(
      "fechar_comanda",
      { p_order_id: order.id, p_payment_method: payment }
    );

    setConfirming(false);

    if (error) {
      toast.error(error.message || "Erro ao fechar comanda");
      return;
    }

    const finalTotal = Number(data?.total ?? total);
    toast.success(`✅ Venda de ${brl.format(finalTotal)} registrada!`);

    setClosedSnapshot({
      items: [...items],
      total: finalTotal,
      payment,
      closedAt: data?.closed_at ? new Date(data.closed_at) : new Date(),
      customerName: order.customer_name,
    });

    // Pré-preencher WhatsApp do cliente vinculado, se houver
    if (order.customer_id) {
      const { data: cust } = await supabase
        .from("customers")
        .select("whatsapp")
        .eq("id", order.customer_id)
        .maybeSingle();
      if (cust?.whatsapp) {
        setPhone(maskPhoneBR(cust.whatsapp));
      }
    }

    setStep("share");
  };

  const buildWhatsAppMessage = () => {
    if (!closedSnapshot) return "";
    const { items: snapItems, total: snapTotal, payment: snapPayment, closedAt, customerName } = closedSnapshot;
    const businessName = business.business_name || "Estabelecimento";
    const dateStr = closedAt.toLocaleDateString("pt-BR");
    const timeStr = closedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const itemsLines = snapItems
      .map((i) => `• ${i.product_name} x${i.quantity} — ${brl.format(Number(i.subtotal))}`)
      .join("\n");

    const greeting = customerName ? `Olá, ${customerName}! 👋` : "Olá! 👋";

    return [
      `*${businessName}*`,
      `Resumo do seu pedido`,
      `${dateStr} às ${timeStr}`,
      ``,
      greeting,
      ``,
      `*Itens:*`,
      itemsLines,
      ``,
      `*Forma de pagamento:* ${paymentLabel[snapPayment]}`,
      `*Total:* ${brl.format(snapTotal)}`,
      ``,
      `Obrigado pela preferência! 😊`,
      `Volte sempre!`,
      ``,
      `_by FluxoComanda · FCIA Soluções em Tecnologia_`,
    ].join("\n");
  };

  const sendWhatsApp = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Informe um WhatsApp válido");
      return;
    }
    const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
    const message = buildWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const url = isMobile
      ? `whatsapp://send?phone=${fullNumber}&text=${encoded}`
      : `https://wa.me/${fullNumber}?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setCloseOpen(false);
    setClosedSnapshot(null);
    navigate(postSaleRedirect, { replace: true });
  };

  const closeWithoutSending = () => {
    setCloseOpen(false);
    setClosedSnapshot(null);
    navigate(postSaleRedirect, { replace: true });
  };

  const openGuardar = () => {
    if (items.length === 0) {
      toast.error("Adicione ao menos 1 item");
      return;
    }
    setGuardarNome(order?.customer_name ?? "");
    setGuardarObs("");
    setGuardarOpen(true);
  };

  const confirmGuardar = async () => {
    if (!order || !id) return;
    const nome = guardarNome.trim();
    if (!nome) {
      toast.error("Informe o nome do cliente");
      return;
    }
    setGuardando(true);
    const { error } = await supabase
      .from("orders")
      .update({
        status: "guardada",
        guardada_em: new Date().toISOString(),
        guardada_obs: guardarObs.trim() || null,
        customer_name: nome,
      } as any)
      .eq("id", id);
    setGuardando(false);
    if (error) {
      toast.error(error.message || "Erro ao guardar venda");
      return;
    }
    toast.success("✅ Venda guardada");
    navigate(postSaleRedirect, { replace: true });
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
    <div className="relative">
      {/* Área de Impressão */}
      <ComandaPrint
        order={order}
        items={items}
        business={business}
        customer={customerInfo}
      />

      <AppShell className="print:hidden">
        <div className="pb-20">
        <button
          onClick={() => navigate("/comandas")}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <PageHeader
          left={
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-foreground">{order.customer_name || "Sem nome"}</h1>
              <Badge variant={isClosed ? "secondary" : isGuardada ? "outline" : "default"} className="shrink-0">
                {isClosed ? "Fechada" : isGuardada ? "Guardada" : "Aberta"}
              </Badge>
            </div>
          }
        />

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
                      {!isGarcom && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          aria-label="Remover"
                          onClick={() => removeItem(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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

            {products.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {(["all", "bebidas", "comidas", "outros"] as const).map((cat) => {
                  const active = filterCat === cat;
                  const label = cat === "all" ? "Todos" : CATEGORIA_LABEL[cat];
                  const count =
                    cat === "all"
                      ? products.length
                      : products.filter((p) => p.categoria === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterCat(cat)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      )}
                    >
                      {label}
                      <span className="ml-1 opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

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
            ) : (() => {
              const q = productSearch.trim().toLowerCase();
              const byCat = filterCat === "all"
                ? products
                : products.filter((p) => p.categoria === filterCat);
              const filtered = q
                ? byCat.filter((p) => p.name.toLowerCase().includes(q))
                : byCat;
              return (
                <>
                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar produto..."
                      className="h-11 pl-9 pr-9"
                    />
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => setProductSearch("")}
                        aria-label="Limpar busca"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {filtered.length === 0 ? (
                    <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">
                      {q ? `Nenhum produto encontrado para "${productSearch}".` : "Nenhum produto nesta categoria."}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {filtered.map((p) => (
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
                </>
              );
            })()}
          </section>
        )}
      </div>

      {/* Botões fixos: Guardar / Fechar */}
      {!isClosed && items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-background px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
            <Button
              onClick={openGuardar}
              variant="outline"
              className="h-16 w-full text-sm font-semibold"
            >
              <Bookmark className="h-5 w-5" />
              {isGuardada ? "Atualizar" : "Guardar"}
            </Button>
            <Button
              onClick={openCloseSheet}
              variant="destructive"
              className="h-16 w-full text-sm font-semibold"
            >
              {isGuardada ? "Receber →" : "Fechar →"}
            </Button>
          </div>
        </div>
      )}

      {/* Sheet de fechamento */}
      <Sheet open={closeOpen} onOpenChange={closeSheetAndCleanUrl}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          {step === "payment" && (
            <>
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
            </>
          )}

          {step === "share" && (
            <>
              <SheetHeader>
                <SheetTitle>Deseja enviar o resumo para o cliente?</SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-2">
                <label htmlFor="wa-phone" className="text-sm font-medium text-foreground">
                  WhatsApp do cliente (opcional)
                </label>
                <Input
                  id="wa-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(XX) 9 XXXX-XXXX"
                  value={phone}
                  onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
                  maxLength={16}
                />
              </div>

              <div className="mt-6 grid gap-2">
                <Button
                  onClick={sendWhatsApp}
                  className="h-14 w-full text-base font-semibold"
                  disabled={phone.replace(/\D/g, "").length < 10}
                >
                  <MessageCircle className="h-5 w-5" />
                  Enviar via WhatsApp
                </Button>
                <Button
                  onClick={closeWithoutSending}
                  variant="outline"
                  className="h-12 w-full text-base font-medium"
                >
                  Fechar sem enviar
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog Guardar Venda */}
      <Dialog open={guardarOpen} onOpenChange={setGuardarOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Guardar venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="g-nome" className="text-sm font-medium text-foreground">
                Nome do cliente *
              </label>
              <Input
                id="g-nome"
                value={guardarNome}
                onChange={(e) => setGuardarNome(e.target.value)}
                placeholder="Ex: João da Silva"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="g-obs" className="text-sm font-medium text-foreground">
                Observação (opcional)
              </label>
              <Textarea
                id="g-obs"
                value={guardarObs}
                onChange={(e) => setGuardarObs(e.target.value)}
                placeholder="Ex: pagar na sexta-feira"
                rows={3}
              />
            </div>
            <p className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
              A comanda ficará pendente até você receber o pagamento. Total atual:{" "}
              <span className="font-semibold text-foreground">{brl.format(total)}</span>
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setGuardarOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={confirmGuardar} disabled={guardando}>
              {guardando ? "Salvando..." : "Guardar venda"}
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
