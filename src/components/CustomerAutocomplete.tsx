import { useEffect, useRef, useState } from "react";
import { Loader2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export interface CustomerLite {
  id: string;
  nome: string;
  apelido: string | null;
  whatsapp: string | null;
}

interface Props {
  ownerId: string;
  /** Cliente selecionado (ou null se for um nome livre). */
  value: CustomerLite | null;
  /** Texto exibido no input (nome livre OU nome do cliente). */
  text: string;
  onTextChange: (v: string) => void;
  onSelect: (c: CustomerLite | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmitEnter?: () => void;
}

function maskPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function CustomerAutocomplete({
  ownerId,
  value,
  text,
  onTextChange,
  onSelect,
  placeholder = "Nome, apelido ou WhatsApp",
  autoFocus,
  onSubmitEnter,
}: Props) {
  const [results, setResults] = useState<CustomerLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Form de novo cliente
  const [newNome, setNewNome] = useState("");
  const [newApelido, setNewApelido] = useState("");
  const [newWhats, setNewWhats] = useState("");
  const [saving, setSaving] = useState(false);

  // Buscar enquanto digita
  useEffect(() => {
    if (!ownerId) return;
    const q = text.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let canceled = false;
    setLoading(true);
    const onlyDigits = q.replace(/\D/g, "");
    const filters = [
      `nome.ilike.%${q}%`,
      `apelido.ilike.%${q}%`,
    ];
    if (onlyDigits.length >= 3) filters.push(`whatsapp.ilike.%${onlyDigits}%`);

    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, nome, apelido, whatsapp")
        .eq("user_id", ownerId)
        .or(filters.join(","))
        .order("nome", { ascending: true })
        .limit(8);
      if (canceled) return;
      setLoading(false);
      if (error) {
        console.error("[CustomerAutocomplete] erro:", error);
        setResults([]);
        return;
      }
      setResults((data ?? []) as CustomerLite[]);
    }, 220);

    return () => {
      canceled = true;
      clearTimeout(t);
    };
  }, [text, ownerId]);

  // Fechar lista ao clicar fora
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const openCreateDialog = () => {
    setNewNome(text.trim());
    setNewApelido("");
    setNewWhats("");
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const nome = newNome.trim();
    if (!nome) {
      toast.error("Informe o nome do cliente");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("customers")
      .insert({
        user_id: ownerId,
        nome,
        apelido: newApelido.trim() || null,
        whatsapp: newWhats.replace(/\D/g, "") || null,
      })
      .select("id, nome, apelido, whatsapp")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error("Erro ao cadastrar cliente", { description: error?.message });
      return;
    }
    toast.success("Cliente cadastrado");
    onSelect(data as CustomerLite);
    onTextChange((data as CustomerLite).nome);
    setCreateOpen(false);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onTextChange(e.target.value);
          setOpen(true);
          if (value) onSelect(null); // texto mudou → desliga vínculo anterior
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !open && onSubmitEnter) onSubmitEnter();
        }}
        placeholder={placeholder}
        className="h-14 text-base"
        autoFocus={autoFocus}
      />

      {value && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm">
          <span className="font-medium text-foreground">
            {value.nome}
            {value.apelido ? ` (${value.apelido})` : ""}
          </span>
          {value.whatsapp && (
            <span className="text-muted-foreground">· {maskPhoneBR(value.whatsapp)}</span>
          )}
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              onTextChange("");
            }}
            className="ml-auto text-muted-foreground hover:text-foreground"
            aria-label="Limpar cliente"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {open && !value && text.trim().length >= 2 && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-border bg-popover shadow-lg">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          )}
          {!loading &&
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c);
                  onTextChange(c.nome);
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted/60"
              >
                <span className="text-sm font-medium text-foreground">
                  {c.nome}
                  {c.apelido ? <span className="text-muted-foreground"> ({c.apelido})</span> : null}
                </span>
                {c.whatsapp && (
                  <span className="text-xs text-muted-foreground">
                    {maskPhoneBR(c.whatsapp)}
                  </span>
                )}
              </button>
            ))}
          <button
            type="button"
            onClick={openCreateDialog}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-primary/10"
          >
            <UserPlus className="h-4 w-4" />
            Cadastrar novo: "{text.trim()}"
          </button>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar novo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nc-nome">Nome *</Label>
              <Input
                id="nc-nome"
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                className="h-12"
                autoFocus
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nc-apelido">Apelido</Label>
              <Input
                id="nc-apelido"
                value={newApelido}
                onChange={(e) => setNewApelido(e.target.value)}
                className="h-12"
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nc-whats">WhatsApp</Label>
              <Input
                id="nc-whats"
                value={maskPhoneBR(newWhats)}
                onChange={(e) => setNewWhats(e.target.value)}
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button onClick={submitCreate} disabled={saving} className="h-12 w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar e usar"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              className="h-12 w-full"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
