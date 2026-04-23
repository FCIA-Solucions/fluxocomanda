import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { buildReportPdf, fmtBRL } from "@/lib/pdfReport";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const monthShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface OrderRow {
  id: string;
  customer_name: string | null;
  total: number;
  closed_at: string | null;
  created_at: string;
}
interface ItemRow {
  order_id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
}

interface ProductAgg {
  name: string;
  qty: number;
  total: number;
}

interface ClosureRow {
  id: string;
  closed_at: string;
  type: "manual" | "auto";
  closed_by_name: string | null;
  total: number;
  sales_count: number;
}

const EMPTY_MSG = "Nenhuma comanda fechada neste período.";

function topProducts(items: ItemRow[], limit = 10): ProductAgg[] {
  const map = new Map<string, ProductAgg>();
  items.forEach((it) => {
    const cur = map.get(it.product_name) ?? { name: it.product_name, qty: 0, total: 0 };
    cur.qty += Number(it.quantity ?? 0);
    cur.total += Number(it.subtotal ?? 0);
    map.set(it.product_name, cur);
  });
  return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, limit);
}

function mostOrdered(items: ItemRow[]): string {
  const top = topProducts(items, 1)[0];
  return top?.name ?? "—";
}

async function fetchClosedOrders(userId: string, startISO: string, endISO: string) {
  const ordersRes = await supabase
    .from("orders")
    .select("id, customer_name, total, closed_at, created_at")
    .eq("user_id", userId)
    .eq("status", "closed")
    .gte("closed_at", startISO)
    .lt("closed_at", endISO)
    .order("closed_at", { ascending: true });
  const orders = (ordersRes.data ?? []) as OrderRow[];
  if (orders.length === 0) return { orders, items: [] as ItemRow[] };
  const itemsRes = await supabase
    .from("order_items")
    .select("order_id, product_name, quantity, subtotal")
    .in("order_id", orders.map((o) => o.id));
  const items = (itemsRes.data ?? []) as ItemRow[];
  return { orders, items };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// =================== DIÁRIO ===================
function DailyReport({ businessName }: { businessName: string }) {
  const { user } = useAuth();
  const today = new Date();
  const [date, setDate] = useState(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [closures, setClosures] = useState<ClosureRow[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [y, m, d] = date.split("-").map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
    const [{ orders, items }, closuresRes] = await Promise.all([
      fetchClosedOrders(user.id, start.toISOString(), end.toISOString()),
      supabase
        .from("cash_closures")
        .select("id, closed_at, type, closed_by_name, total, sales_count")
        .eq("user_id", user.id)
        .eq("business_day", date)
        .order("closed_at", { ascending: false }),
    ]);
    setOrders(orders);
    setItems(items);
    if (closuresRes.error) {
      console.warn("cash_closures indisponível:", closuresRes.error.message);
      setClosures([]);
    } else {
      setClosures((closuresRes.data ?? []) as ClosureRow[]);
    }
    setLoading(false);
  }, [user, date]);

  useEffect(() => { load(); }, [load]);

  const totalFaturado = orders.reduce((a, o) => a + Number(o.total ?? 0), 0);
  const totalComandas = orders.length;
  const ticketMedio = totalComandas > 0 ? totalFaturado / totalComandas : 0;
  const top = topProducts(items, 10);

  const itemsByOrder = useMemo(() => {
    const map = new Map<string, ItemRow[]>();
    items.forEach((it) => {
      const arr = map.get(it.order_id) ?? [];
      arr.push(it);
      map.set(it.order_id, arr);
    });
    return map;
  }, [items]);

  const handleExport = () => {
    const [y, m, d] = date.split("-");
    buildReportPdf({
      businessName,
      reportTitle: "Relatório Diário",
      reportPeriod: `Dia ${d}/${m}/${y}`,
      fileName: `relatorio-diario-${d}-${m}-${y}.pdf`,
      summary: [
        { label: "Total Faturado", value: fmtBRL(totalFaturado) },
        { label: "Comandas Fechadas", value: String(totalComandas) },
        { label: "Ticket Médio", value: fmtBRL(ticketMedio) },
        { label: "Produto Mais Pedido", value: mostOrdered(items) },
      ],
      sections: [
        {
          title: "Top 10 Produtos",
          head: ["Produto", "Qtd", "Total"],
          rows: top.map((p) => [p.name, String(p.qty), fmtBRL(p.total)]),
          emptyMessage: EMPTY_MSG,
        },
        {
          title: "Comandas do Dia",
          head: ["Mesa/Identificação", "Itens", "Valor", "Fechamento"],
          rows: orders.map((o) => {
            const list = itemsByOrder.get(o.id) ?? [];
            const itensStr = list.map((i) => `${i.quantity}x ${i.product_name}`).join(", ") || "—";
            return [
              o.customer_name ?? "—",
              itensStr,
              fmtBRL(Number(o.total ?? 0)),
              o.closed_at ? timeFmt.format(new Date(o.closed_at)) : "—",
            ];
          }),
          emptyMessage: EMPTY_MSG,
        },
        {
          title: "Fechamentos de Caixa",
          head: ["Hora", "Tipo", "Responsável", "Vendas", "Total"],
          rows: closures.map((c) => [
            timeFmt.format(new Date(c.closed_at)),
            c.type === "manual" ? "Manual" : "Automático",
            c.closed_by_name ?? "—",
            String(c.sales_count ?? 0),
            fmtBRL(Number(c.total ?? 0)),
          ]),
          emptyMessage: "Nenhum fechamento de caixa neste dia.",
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="day-date">Selecione o dia</Label>
        <Input id="day-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-base" style={{ height: 52 }} />
      </div>

      <SummaryGrid items={[
        { label: "Total Faturado", value: fmtBRL(totalFaturado) },
        { label: "Comandas Fechadas", value: String(totalComandas) },
        { label: "Ticket Médio", value: fmtBRL(ticketMedio) },
        { label: "Mais Pedido", value: mostOrdered(items) },
      ]} loading={loading} />

      <Section title="Top 10 Produtos">
        {loading ? <SkeletonRows /> : top.length === 0 ? <EmptyState /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {top.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{p.qty}</TableCell>
                  <TableCell className="text-right">{fmtBRL(p.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section title="Comandas do Dia">
        {loading ? <SkeletonRows /> : orders.length === 0 ? <EmptyState /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Mesa/ID</TableHead><TableHead>Itens</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Hora</TableHead></TableRow></TableHeader>
            <TableBody>
              {orders.map((o) => {
                const list = itemsByOrder.get(o.id) ?? [];
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.customer_name ?? "—"}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">{list.map((i) => `${i.quantity}x ${i.product_name}`).join(", ") || "—"}</TableCell>
                    <TableCell className="text-right">{fmtBRL(Number(o.total ?? 0))}</TableCell>
                    <TableCell className="text-right">{o.closed_at ? timeFmt.format(new Date(o.closed_at)) : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Section>

      <Button onClick={handleExport} disabled={loading || orders.length === 0} className="h-14 w-full text-base font-semibold">
        <Download className="mr-2 h-5 w-5" /> Baixar PDF do Dia
      </Button>
    </div>
  );
}

// =================== MENSAL ===================
function MonthlyReport({ businessName }: { businessName: string }) {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const { orders, items } = await fetchClosedOrders(user.id, start.toISOString(), end.toISOString());
    setOrders(orders);
    setItems(items);
    setLoading(false);
  }, [user, year, month]);

  useEffect(() => { load(); }, [load]);

  const totalFaturado = orders.reduce((a, o) => a + Number(o.total ?? 0), 0);
  const totalComandas = orders.length;
  const ticketMedio = totalComandas > 0 ? totalFaturado / totalComandas : 0;
  const top = topProducts(items, 10);

  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyChart = useMemo(() => {
    const arr = Array.from({ length: daysInMonth }, (_, i) => ({ dia: String(i + 1).padStart(2, "0"), total: 0 }));
    orders.forEach((o) => {
      if (!o.closed_at) return;
      const d = new Date(o.closed_at).getDate();
      arr[d - 1].total += Number(o.total ?? 0);
    });
    return arr;
  }, [orders, daysInMonth]);

  const bestDay = useMemo(() => {
    const best = [...dailyChart].sort((a, b) => b.total - a.total)[0];
    if (!best || best.total === 0) return "—";
    return `Dia ${best.dia} — ${fmtBRL(best.total)}`;
  }, [dailyChart]);

  const handleExport = () => {
    buildReportPdf({
      businessName,
      reportTitle: "Relatório Mensal",
      reportPeriod: `${monthNames[month - 1]} de ${year}`,
      fileName: `relatorio-mensal-${pad(month)}-${year}.pdf`,
      summary: [
        { label: "Faturamento do Mês", value: fmtBRL(totalFaturado) },
        { label: "Total de Comandas", value: String(totalComandas) },
        { label: "Ticket Médio", value: fmtBRL(ticketMedio) },
        { label: "Maior Movimento", value: bestDay },
      ],
      sections: [
        {
          title: "Faturamento por Dia",
          head: ["Dia", "Faturamento"],
          rows: dailyChart.filter((d) => d.total > 0).map((d) => [`${d.dia}/${pad(month)}`, fmtBRL(d.total)]),
          emptyMessage: EMPTY_MSG,
        },
        {
          title: "Top 10 Produtos do Mês",
          head: ["Produto", "Qtd", "Total"],
          rows: top.map((p) => [p.name, String(p.qty), fmtBRL(p.total)]),
          emptyMessage: EMPTY_MSG,
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="m-month">Mês</Label>
          <select id="m-month" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="h-[52px] w-full rounded-md border border-input bg-background px-3 text-base">
            {monthNames.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-year">Ano</Label>
          <Input id="m-year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="text-base" style={{ height: 52 }} />
        </div>
      </div>

      <SummaryGrid items={[
        { label: "Faturamento do Mês", value: fmtBRL(totalFaturado) },
        { label: "Total de Comandas", value: String(totalComandas) },
        { label: "Ticket Médio", value: fmtBRL(ticketMedio) },
        { label: "Maior Movimento", value: bestDay },
      ]} loading={loading} />

      <Section title="Faturamento por Dia">
        {loading ? <SkeletonRows /> : orders.length === 0 ? <EmptyState /> : (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      <Section title="Top 10 Produtos do Mês">
        {loading ? <SkeletonRows /> : top.length === 0 ? <EmptyState /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {top.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{p.qty}</TableCell>
                  <TableCell className="text-right">{fmtBRL(p.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Button onClick={handleExport} disabled={loading || orders.length === 0} className="h-14 w-full text-base font-semibold">
        <Download className="mr-2 h-5 w-5" /> Baixar PDF do Mês
      </Button>
    </div>
  );
}

// =================== ANUAL ===================
function YearlyReport({ businessName }: { businessName: string }) {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    const { orders, items } = await fetchClosedOrders(user.id, start.toISOString(), end.toISOString());
    setOrders(orders);
    setItems(items);
    setLoading(false);
  }, [user, year]);

  useEffect(() => { load(); }, [load]);

  const totalFaturado = orders.reduce((a, o) => a + Number(o.total ?? 0), 0);
  const totalComandas = orders.length;
  const ticketMedio = totalComandas > 0 ? totalFaturado / totalComandas : 0;
  const top = topProducts(items, 10);

  const monthlyChart = useMemo(() => {
    const arr = monthShort.map((m) => ({ mes: m, total: 0 }));
    orders.forEach((o) => {
      if (!o.closed_at) return;
      const idx = new Date(o.closed_at).getMonth();
      arr[idx].total += Number(o.total ?? 0);
    });
    return arr;
  }, [orders]);

  const bestMonth = useMemo(() => {
    const best = [...monthlyChart].map((v, i) => ({ ...v, full: monthNames[i] })).sort((a, b) => b.total - a.total)[0];
    if (!best || best.total === 0) return "—";
    return `${best.full} — ${fmtBRL(best.total)}`;
  }, [monthlyChart]);

  const handleExport = () => {
    buildReportPdf({
      businessName,
      reportTitle: "Relatório Anual",
      reportPeriod: `Ano de ${year}`,
      fileName: `relatorio-anual-${year}.pdf`,
      summary: [
        { label: "Faturamento do Ano", value: fmtBRL(totalFaturado) },
        { label: "Melhor Mês", value: bestMonth },
        { label: "Ticket Médio Anual", value: fmtBRL(ticketMedio) },
        { label: "Total de Comandas", value: String(totalComandas) },
      ],
      sections: [
        {
          title: "Faturamento por Mês",
          head: ["Mês", "Faturamento"],
          rows: monthlyChart.map((m, i) => [monthNames[i], fmtBRL(m.total)]),
          emptyMessage: EMPTY_MSG,
        },
        {
          title: "Top 10 Produtos do Ano",
          head: ["Produto", "Qtd", "Total"],
          rows: top.map((p) => [p.name, String(p.qty), fmtBRL(p.total)]),
          emptyMessage: EMPTY_MSG,
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="y-year">Ano</Label>
        <Input id="y-year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="text-base" style={{ height: 52 }} />
      </div>

      <SummaryGrid items={[
        { label: "Faturamento do Ano", value: fmtBRL(totalFaturado) },
        { label: "Melhor Mês", value: bestMonth },
        { label: "Ticket Médio Anual", value: fmtBRL(ticketMedio) },
        { label: "Comandas no Ano", value: String(totalComandas) },
      ]} loading={loading} />

      <Section title="Faturamento por Mês">
        {loading ? <SkeletonRows /> : orders.length === 0 ? <EmptyState /> : (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      <Section title="Top 10 Produtos do Ano">
        {loading ? <SkeletonRows /> : top.length === 0 ? <EmptyState /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {top.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{p.qty}</TableCell>
                  <TableCell className="text-right">{fmtBRL(p.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Button onClick={handleExport} disabled={loading || orders.length === 0} className="h-14 w-full text-base font-semibold">
        <Download className="mr-2 h-5 w-5" /> Baixar PDF do Ano
      </Button>
    </div>
  );
}

// =================== shared bits ===================
function SummaryGrid({ items, loading }: { items: { label: string; value: string }[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl bg-card p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{it.label}</p>
          <p className="mt-1 text-lg font-bold text-foreground">{loading ? "…" : it.value}</p>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-2xl bg-card p-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function EmptyState() {
  return <p className="py-6 text-center text-sm text-muted-foreground">{EMPTY_MSG}</p>;
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      <div className="h-8 w-full animate-pulse rounded bg-muted/50" />
      <div className="h-8 w-full animate-pulse rounded bg-muted/40" />
      <div className="h-8 w-full animate-pulse rounded bg-muted/30" />
    </div>
  );
}

export default function Relatorios() {
  const navigate = useNavigate();
  const { business } = useBusiness();
  const businessName = business.business_name?.trim() || "Meu Negócio";

  return (
    <AppShell>
      <header className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar" className="min-h-touch min-w-touch">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Diário, mensal e anual com export em PDF</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="diario" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diario">Diário</TabsTrigger>
          <TabsTrigger value="mensal">Mensal</TabsTrigger>
          <TabsTrigger value="anual">Anual</TabsTrigger>
        </TabsList>
        <TabsContent value="diario" className="mt-4">
          <DailyReport businessName={businessName} />
        </TabsContent>
        <TabsContent value="mensal" className="mt-4">
          <MonthlyReport businessName={businessName} />
        </TabsContent>
        <TabsContent value="anual" className="mt-4">
          <YearlyReport businessName={businessName} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
