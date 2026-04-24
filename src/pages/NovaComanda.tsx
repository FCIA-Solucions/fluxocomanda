import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Eye, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

interface DuplicateOrder {
  id: string;
  customer_name: string | null;
  total: number;
  created_at: string;
}

export default function NovaComanda() {
  const { user } = useAuth();
  const { effectiveUserId } = useProfile();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateOrder, setDuplicateOrder] = useState<DuplicateOrder | null>(null);

  const doInsert = async (trimmed: string) => {
    if (!effectiveUserId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: effectiveUserId,
        customer_name: trimmed,
        status: "open",
        total: 0,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error("Erro ao criar comanda");
      return;
    }
    toast.success("Comanda criada");
    navigate(`/comandas/${data.id}`, { replace: true });
  };

  const handleCreate = async () => {
    if (!user || !effectiveUserId) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Informe o nome ou mesa");
      return;
    }

    setChecking(true);
    const { data: existing, error } = await supabase
      .from("orders")
      .select("id, customer_name, total, created_at")
      .eq("status", "open")
      .ilike("customer_name", `%${trimmed}%`)
      .order("created_at", { ascending: false })
      .limit(3);
    setChecking(false);

    if (error) {
      toast.error("Erro ao verificar comandas");
      return;
    }

    if (existing && existing.length > 0) {
      setDuplicateOrder(existing[0] as DuplicateOrder);
      setDuplicateOpen(true);
      return;
    }

    await doInsert(trimmed);
  };

  const handleViewExisting = () => {
    if (!duplicateOrder) return;
    setDuplicateOpen(false);
    navigate(`/comandas/${duplicateOrder.id}`, { replace: true });
  };

  const handleCreateAnyway = async () => {
    setDuplicateOpen(false);
    setDuplicateOrder(null);
    await doInsert(name.trim());
  };

  const handleCancelDuplicate = () => {
    setDuplicateOpen(false);
    setDuplicateOrder(null);
  };

  const busy = checking || saving;
  const buttonLabel = checking ? "Verificando..." : saving ? "Criando..." : "Criar Comanda";

  return (
    <AppShell>
      <button
        onClick={() => navigate("/comandas")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        aria-label="Voltar"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nova comanda</h1>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer-name">Nome ou mesa</Label>
          <Input
            id="customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Mesa 3, João"
            className="h-14 text-base"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
        </div>
        <Button
          onClick={handleCreate}
          disabled={busy}
          className="h-14 w-full text-base font-semibold"
        >
          {buttonLabel}
        </Button>
      </div>

      <AlertDialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" aria-hidden />
              Comanda já existe
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p>
                  Já existe uma comanda aberta para{" "}
                  <span className="font-semibold text-foreground">
                    "{duplicateOrder?.customer_name ?? "Sem nome"}"
                  </span>
                </p>
                {duplicateOrder && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="text-foreground">
                      💰 Valor parcial:{" "}
                      <span className="font-semibold">
                        {brl.format(Number(duplicateOrder.total))}
                      </span>
                    </p>
                    <p className="mt-1 text-foreground">
                      🕐 Aberta às:{" "}
                      <span className="font-semibold">
                        {time.format(new Date(duplicateOrder.created_at))}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              onClick={handleViewExisting}
              className="h-12 w-full justify-center text-base font-semibold"
            >
              <Eye className="mr-2 h-4 w-4" /> Ver comanda existente
            </Button>
            <Button
              variant="secondary"
              onClick={handleCreateAnyway}
              disabled={saving}
              className="h-12 w-full justify-center text-base"
            >
              <Plus className="mr-2 h-4 w-4" /> Abrir nova mesmo assim
            </Button>
            <Button
              variant="ghost"
              onClick={handleCancelDuplicate}
              className="h-12 w-full justify-center text-base"
            >
              <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
