import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

export default function NovaComanda() {
  const { user } = useAuth();
  const { effectiveUserId } = useProfile();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!user || !effectiveUserId) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Informe o nome ou mesa");
      return;
    }
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
          disabled={saving}
          className="h-14 w-full text-base font-semibold"
        >
          {saving ? "Criando..." : "Criar Comanda"}
        </Button>
      </div>
    </AppShell>
  );
}
