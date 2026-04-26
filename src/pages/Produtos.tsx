import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

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
  active: boolean;
  categoria: Categoria;
}

// Máscara: input em string de dígitos → reais (number)
const formatPriceInput = (digits: string) => {
  const cents = parseInt(digits || "0", 10);
  return brl.format(cents / 100);
};

export default function Produtos() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [priceDigits, setPriceDigits] = useState(""); // só dígitos (centavos)
  const [categoria, setCategoria] = useState<Categoria>("outros");
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Tenta buscar com a coluna 'categoria'. Se ela ainda não existir no banco,
    // faz fallback para a query antiga (sem categoria) para a tela continuar funcionando.
    let { data, error } = await supabase
      .from("products")
      .select("id, name, price, active, categoria")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error && /categoria/i.test(error.message)) {
      const fallback = await supabase
        .from("products")
        .select("id, name, price, active")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      data = fallback.data as typeof data;
      error = fallback.error;
    }

    if (error) {
      console.error("[Produtos] erro ao carregar:", error);
      toast.error("Erro ao carregar produtos", { description: error.message });
    } else {
      setProducts(
        (data ?? []).map((p: { id: string; name: string; price: number; active: boolean; categoria?: unknown }) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          active: p.active,
          categoria: normalizeCategoria(p.categoria),
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openNew = () => {
    setEditing(null);
    setName("");
    setPriceDigits("");
    setCategoria("outros");
    setSheetOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setPriceDigits(String(Math.round(p.price * 100)));
    setCategoria(p.categoria);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }
    const cents = parseInt(priceDigits || "0", 10);
    if (cents <= 0) {
      toast.error("Informe um preço válido");
      return;
    }
    const price = cents / 100;
    setSaving(true);
    if (editing) {
      let { error } = await supabase
        .from("products")
        .update({ name: name.trim(), price, categoria })
        .eq("id", editing.id);
      if (error && /categoria/i.test(error.message)) {
        ({ error } = await supabase
          .from("products")
          .update({ name: name.trim(), price })
          .eq("id", editing.id));
      }
      if (error) toast.error("Erro ao salvar", { description: error.message });
      else {
        toast.success("Produto atualizado");
        setSheetOpen(false);
        fetchProducts();
      }
    } else {
      let { error } = await supabase
        .from("products")
        .insert({ user_id: user.id, name: name.trim(), price, active: true, categoria });
      if (error && /categoria/i.test(error.message)) {
        ({ error } = await supabase
          .from("products")
          .insert({ user_id: user.id, name: name.trim(), price, active: true }));
      }
      if (error) toast.error("Erro ao criar", { description: error.message });
      else {
        toast.success("Produto criado");
        setSheetOpen(false);
        fetchProducts();
      }
    }
    setSaving(false);
  };

  const toggleActive = async (p: Product) => {
    const next = !p.active;
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: next } : x)));
    const { error } = await supabase
      .from("products")
      .update({ active: next })
      .eq("id", p.id);
    if (error) {
      toast.error("Erro ao atualizar");
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: p.active } : x)));
    } else {
      toast.success(next ? "Produto ativado" : "Produto desativado");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      toast.error("Erro ao excluir", { description: error.message });
    } else {
      toast.success("Produto excluído");
      fetchProducts();
    }
    setDeleteTarget(null);
  };

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Produtos</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Nenhum produto cadastrado.
            <br />
            Toque em + para adicionar.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-2xl bg-card p-4"
            >
              <button
                onClick={() => openEdit(p)}
                className="flex-1 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{p.name}</span>
                  <Badge variant={p.active ? "default" : "secondary"}>
                    {p.active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Badge variant="outline">{CATEGORIA_LABEL[p.categoria]}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{brl.format(p.price)}</p>
              </button>
              <Switch
                checked={p.active}
                onCheckedChange={() => toggleActive(p)}
                aria-label="Ativar/Desativar"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget(p)}
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
        aria-label="Novo produto"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Sheet criação/edição */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar produto" : "Novo produto"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prod-name">Nome</Label>
              <Input
                id="prod-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cerveja"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-price">Preço</Label>
              <Input
                id="prod-price"
                inputMode="numeric"
                value={priceDigits ? formatPriceInput(priceDigits) : ""}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  setPriceDigits(onlyDigits);
                }}
                placeholder="R$ 0,00"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-categoria">Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
                <SelectTrigger id="prod-categoria" className="h-12">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bebidas">Bebidas</SelectItem>
                  <SelectItem value="comidas">Comidas</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="h-14 w-full text-base font-semibold">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" será removido permanentemente do seu cardápio. Vendas já registradas não serão afetadas.
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
