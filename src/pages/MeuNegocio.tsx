import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, Check, FileText, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { BRAND_COLORS, DEFAULT_BRAND_COLOR } from "@/lib/colorUtils";
import { cn } from "@/lib/utils";

export default function MeuNegocio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { business, loading, refresh, setLocal } = useBusiness();
  const fileInput = useRef<HTMLInputElement>(null);

  const [businessName, setBusinessName] = useState("");
  const [brandColor, setBrandColor] = useState<string>(DEFAULT_BRAND_COLOR);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setBusinessName(business.business_name ?? "");
    setBrandColor(business.brand_color ?? DEFAULT_BRAND_COLOR);
    setLogoUrl(business.logo_url ?? null);
  }, [business]);

  const handlePickColor = (value: string) => {
    setBrandColor(value);
    setLocal({ brand_color: value }); // preview imediato
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 2MB)");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error("Falha no upload", { description: upErr.message });
      return;
    }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Logo carregada");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        business_name: businessName.trim() || null,
        logo_url: logoUrl,
        brand_color: brandColor,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar", { description: error.message });
      return;
    }
    toast.success("Configurações salvas! ✅");
    await refresh();
  };

  return (
    <AppShell>
      <header className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar" className="min-h-touch min-w-touch">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Negócio</h1>
          <p className="text-sm text-muted-foreground">Personalize a identidade do seu app</p>
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Nome do estabelecimento */}
          <section className="space-y-2 rounded-2xl bg-card p-4">
            <Label htmlFor="business-name">Nome do estabelecimento</Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex.: Bar do João"
              className="text-base"
              style={{ height: 52 }}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">Aparece no topo do Início.</p>
          </section>

          {/* Logo */}
          <section className="space-y-3 rounded-2xl bg-card p-4">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-background">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo do estabelecimento" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">Sem logo</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {logoUrl ? "Trocar logo" : "Enviar logo"}
                </Button>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => setLogoUrl(null)}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">PNG ou JPG, até 2MB.</p>
          </section>

          {/* Cor principal */}
          <section className="space-y-3 rounded-2xl bg-card p-4">
            <Label>Cor principal</Label>
            <div className="flex flex-wrap gap-3">
              {BRAND_COLORS.map((c) => {
                const selected = brandColor.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handlePickColor(c.value)}
                    aria-label={c.name}
                    aria-pressed={selected}
                    className={cn(
                      "relative h-12 w-12 rounded-full border-2 transition-transform",
                      selected ? "scale-110 border-foreground" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.value }}
                  >
                    {selected && (
                      <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Aplica em botões e destaques do app.</p>
          </section>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-14 w-full text-base font-semibold"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar"}
          </Button>

          {/* Relatórios */}
          <button
            type="button"
            onClick={() => navigate("/relatorios")}
            className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-left transition-colors hover:bg-card/80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Relatórios</p>
                <p className="text-xs text-muted-foreground">Diário, mensal e anual com export em PDF</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Resetar dia de hoje */}
          <section className="space-y-3 rounded-2xl border border-destructive/30 bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Resetar dia de hoje</p>
                <p className="text-xs text-muted-foreground">
                  Apaga vendas, comandas e fechamento do dia. Não afeta produtos.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="h-11 w-full"
              onClick={() => setResetOpen(true)}
            >
              Resetar agora
            </Button>
          </section>

          {/* Sobre o app */}
          <section className="space-y-2 rounded-2xl bg-card p-4 text-center">
            <p className="text-sm font-semibold text-foreground">
              FluxoComanda <span className="text-muted-foreground">v1.0</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Desenvolvido por{" "}
              <span className="font-semibold" style={{ color: "#22c55e" }}>FCIA</span>{" "}
              Soluções Inteligentes
            </p>
            <a
              href="https://fciapremium.lovable.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm underline hover:text-foreground"
              style={{ color: "#22c55e" }}
            >
              fciapremium.lovable.app
            </a>
            <p className="text-xs text-muted-foreground">
              © 2026 FCIA. Todos os direitos reservados.
            </p>
          </section>
        </div>
      )}

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar dia de hoje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação vai apagar TODAS as vendas, comandas e fechamentos de
              caixa do dia de hoje da sua conta. Os relatórios também serão
              zerados para hoje. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReset();
              }}
              disabled={resetting}
            >
              {resetting ? "Resetando…" : "Sim, resetar hoje"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
