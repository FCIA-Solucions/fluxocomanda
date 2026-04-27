import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Search, Shield, ShieldOff, Power, Calendar as CalendarIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_EMAIL } from "@/lib/subscriptionConfig";

type Plano = "trial" | "mensal" | "vitalicio";

interface ProfileRow {
  id: string;
  business_name: string | null;
  email: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  subscription_expires_at: string | null;
  role: "admin" | "garcom" | "superadmin" | null;
  created_at: string;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getPlano(row: ProfileRow): Plano {
  const s = (row.subscription_status ?? "").toLowerCase();
  if (s === "vitalicio" || s === "lifetime") return "vitalicio";
  if (s === "active" || s === "mensal") return "mensal";
  return "trial";
}

function isAtivo(row: ProfileRow): boolean {
  const s = (row.subscription_status ?? "").toLowerCase();
  return s !== "inactive" && s !== "blocked" && s !== "inativo";
}

function getEffectiveStatus(row: ProfileRow): "ativo" | "trial" | "expirado" | "inativo" {
  if (!isAtivo(row)) return "inativo";
  const plano = getPlano(row);
  const now = Date.now();
  if (plano === "vitalicio") return "ativo";
  if (plano === "mensal") {
    const exp = row.subscription_expires_at
      ? new Date(row.subscription_expires_at).getTime()
      : 0;
    return exp > now ? "ativo" : "expirado";
  }
  // trial
  const t = row.trial_ends_at ? new Date(row.trial_ends_at).getTime() : 0;
  return t > now ? "trial" : "expirado";
}

function StatusBadge({ row }: { row: ProfileRow }) {
  const s = getEffectiveStatus(row);
  if (s === "ativo")
    return <Badge className="bg-emerald-500 hover:bg-emerald-500/90 text-white">Ativo</Badge>;
  if (s === "trial")
    return <Badge className="bg-amber-500 hover:bg-amber-500/90 text-white">Trial</Badge>;
  if (s === "expirado")
    return <Badge className="bg-red-500 hover:bg-red-500/90 text-white">Expirado</Badge>;
  return <Badge variant="secondary">Inativo</Badge>;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [editPlano, setEditPlano] = useState<Plano>("trial");
  const [editExpires, setEditExpires] = useState("");
  const [editTrial, setEditTrial] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const isAuthorized =
    !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, business_name, email, subscription_status, trial_ends_at, subscription_expires_at, role, created_at"
      )
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar clientes: " + error.message);
      setRows([]);
    } else {
      // Mostrar só os donos (admin); ocultar garçons
      setRows(((data ?? []) as ProfileRow[]).filter((r) => r.role !== "garcom"));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthorized) load();
  }, [isAuthorized]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.business_name ?? "").toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAuthorized) return <Navigate to="/" replace />;

  const toggleAtivo = async (row: ProfileRow) => {
    setSavingId(row.id);
    let novoStatus: string;
    if (isAtivo(row)) {
      novoStatus = "inactive";
    } else {
      // Reativar: escolhe o status apropriado pelos campos atuais
      if ((row.subscription_status ?? "").toLowerCase() === "vitalicio") {
        novoStatus = "vitalicio";
      } else if (
        row.subscription_expires_at &&
        new Date(row.subscription_expires_at).getTime() > Date.now()
      ) {
        novoStatus = "active";
      } else {
        novoStatus = "trial";
      }
    }
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: novoStatus })
      .eq("id", row.id);
    setSavingId(null);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success(isAtivo(row) ? "Cliente desativado" : "Cliente ativado");
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, subscription_status: novoStatus } : r))
    );
  };

  const openEdit = (row: ProfileRow) => {
    setEditing(row);
    setEditPlano(getPlano(row));
    setEditExpires(toDateInputValue(row.subscription_expires_at));
    setEditTrial(toDateInputValue(row.trial_ends_at));
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingId(editing.id);
    const update: Partial<ProfileRow> = {};
    if (editPlano === "trial") {
      update.subscription_status = "trial";
      update.trial_ends_at = editTrial ? new Date(editTrial).toISOString() : null;
      update.subscription_expires_at = null;
    } else if (editPlano === "mensal") {
      update.subscription_status = "active";
      update.subscription_expires_at = editExpires
        ? new Date(editExpires).toISOString()
        : null;
      update.trial_ends_at = null;
    } else {
      update.subscription_status = "vitalicio";
      update.trial_ends_at = null;
      update.subscription_expires_at = null;
    }
    const { error } = await supabase.from("profiles").update(update).eq("id", editing.id);
    setSavingId(null);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Plano atualizado");
    setEditing(null);
    load();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-4 pb-24">
        <PageHeader
          left={
            <>
              <Shield className="h-6 w-6 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">Gerenciar clientes e assinaturas</p>
                <h1 className="truncate text-2xl font-bold">Painel Admin FCIA</h1>
              </div>
            </>
          }
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do negócio ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((row) => {
              const plano = getPlano(row);
              const expDate =
                plano === "vitalicio"
                  ? "Vitalício"
                  : plano === "mensal"
                  ? formatDate(row.subscription_expires_at)
                  : formatDate(row.trial_ends_at);
              const ativo = isAtivo(row);
              return (
                <div key={row.id} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {row.business_name || "(sem nome)"}
                        </h3>
                        <StatusBadge row={row} />
                        <Badge variant="outline" className="capitalize">
                          {plano}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground truncate">
                        {row.email || "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Expira: <span className="font-medium">{expDate}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(row)}
                        disabled={savingId === row.id}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Definir plano
                      </Button>
                      <Button
                        size="sm"
                        variant={ativo ? "destructive" : "default"}
                        onClick={() => toggleAtivo(row)}
                        disabled={savingId === row.id}
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {ativo ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir plano</DialogTitle>
            <DialogDescription>
              {editing?.business_name || editing?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plano</Label>
              <Select value={editPlano} onValueChange={(v) => setEditPlano(v as Plano)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="vitalicio">Vitalício</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editPlano === "trial" && (
              <div>
                <Label htmlFor="trial-end">Fim do trial</Label>
                <Input
                  id="trial-end"
                  type="date"
                  value={editTrial}
                  onChange={(e) => setEditTrial(e.target.value)}
                />
              </div>
            )}
            {editPlano === "mensal" && (
              <div>
                <Label htmlFor="sub-end">Expira em</Label>
                <Input
                  id="sub-end"
                  type="date"
                  value={editExpires}
                  onChange={(e) => setEditExpires(e.target.value)}
                />
              </div>
            )}
            {editPlano === "vitalicio" && (
              <p className="text-sm text-muted-foreground">
                Plano vitalício não tem data de expiração.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={savingId === editing?.id}>
              {savingId === editing?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
