import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  id: string;
  nome: string;
  apelido: string | null;
  whatsapp: string | null;
  created_at: string;
}

function maskPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function Clientes() {
  const navigate = useNavigate();
  const { effectiveUserId } = useProfile();
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [whats, setWhats] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    if (!effectiveUserId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("id, nome, apelido, whatsapp, created_at")
      .eq("user_id", effectiveUserId)
      .order("nome", { ascending: true });
    setLoading(false);
    if (error) {
      toast.error("Erro ao carregar clientes", { description: error.message });
      return;
    }
    setList((data ?? []) as Customer[]);
  }, [effectiveUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setNome("");
    setApelido("");
    setWhats("");
    setSheetOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setNome(c.nome);
    setApelido(c.apelido ?? "");
    setWhats(c.whatsapp ?? "");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!effectiveUserId) return;
    const n = nome.trim();
    if (!n) {
      toast.error("Informe o nome");
      return;
    }
    setSaving(true);
    const payload = {
      nome: n,
      apelido: apelido.trim() || null,
      whatsapp: whats.replace(/\D/g, "") || null,
    };
    if (editing) {
      const { error } = await supabase
        .from("customers")
        .update(payload)
        .eq("id", editing.id);
      setSaving(false);
      if (error) {
        toast.error("Erro ao salvar", { description: error.message });
        return;
      }
      toast.success("Cliente atualizado");
    } else {
      const { error } = await supabase
        .from("customers")
        .insert({ user_id: effectiveUserId, ...payload });
      setSaving(false);
      if (error) {
        toast.error("Erro ao cadastrar", { description: error.message });
        return;
      }
      toast.success("Cliente cadastrado");
    }
    setSheetOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      toast.error("Erro ao excluir", { description: error.message });
    } else {
      toast.success("Cliente excluído");
      load();
    }
    setDeleteTarget(null);
  };

  const filtered = (() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    const digits = q.replace(/\D/g, "");
    return list.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.apelido ?? "").toLowerCase().includes(q) ||
        (digits && (c.whatsapp ?? "").includes(digits))
    );
  })();

  return (
    <AppShell>
      <button
        onClick={() => navigate("/meu-negocio")}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <PageHeader
        left={
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              {list.length} {list.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
            </p>
            <h1 className="truncate text-2xl font-bold text-foreground">Clientes</h1>
          </div>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, apelido ou WhatsApp"
          className="h-12 pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 text-center text-muted-foreground">
          {list.length === 0
            ? "Nenhum cliente cadastrado. Toque em + para adicionar."
            : "Nenhum cliente encontrado."}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-2xl bg-card p-4"
            >
              <button
                onClick={() => openEdit(c)}
                className="flex-1 text-left"
              >
                <p className="font-semibold text-foreground">
                  {c.nome}
                  {c.apelido && (
                    <span className="ml-1 text-sm text-muted-foreground">({c.apelido})</span>
                  )}
                </p>
                {c.whatsapp && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    📱 {maskPhoneBR(c.whatsapp)}
                  </p>
                )}
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEdit(c)}
                aria-label="Editar"
                className="min-h-touch min-w-touch"
              >
                <Pencil className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget(c)}
                aria-label="Excluir"
                className="min-h-touch min-w-touch text-destructive hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* FAB */}
      <button
        onClick={openNew}
        aria-label="Novo cliente"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Sheet criar/editar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar cliente" : "Novo cliente"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cli-nome">Nome *</Label>
              <Input
                id="cli-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-12"
                maxLength={80}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-apelido">Apelido</Label>
              <Input
                id="cli-apelido"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                className="h-12"
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-whats">WhatsApp</Label>
              <Input
                id="cli-whats"
                value={maskPhoneBR(whats)}
                onChange={(e) => setWhats(e.target.value)}
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                className="h-12"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-14 w-full text-base font-semibold"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmação exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.nome}" será removido. Comandas já registradas no nome dele continuam
              salvas, mas perdem o vínculo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
