import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, Check, FileText, ChevronRight, Users, Lock, UserCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { BRAND_COLORS, DEFAULT_BRAND_COLOR } from "@/lib/colorUtils";
import { cn } from "@/lib/utils";

export default function MeuNegocio() {
  const { user } = useAuth();
  const { role } = useProfile();
  const { status } = useSubscription();
  const navigate = useNavigate();
  const { business, loading, refresh, setLocal } = useBusiness();
  const fileInput = useRef<HTMLInputElement>(null);

  const isAdmin = role === "admin";
  const hasPaidPlan = status === "active";

  const [businessName, setBusinessName] = useState("");
  const [brandColor, setBrandColor] = useState<string>(DEFAULT_BRAND_COLOR);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      <PageHeader
        left={
          <>
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar" className="min-h-touch min-w-touch shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">Personalize o app</p>
              <h1 className="truncate text-2xl font-bold text-foreground">Meu Negócio</h1>
            </div>
          </>
        }
      />

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

          {/* Clientes */}
          <button
            type="button"
            onClick={() => navigate("/clientes")}
            className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-left transition-colors hover:bg-card/80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Clientes</p>
                <p className="text-xs text-muted-foreground">Cadastre e gerencie seus clientes</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

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

          {/* Equipe (gerenciar garçons) — somente admin */}
          {isAdmin && (
            <section className="space-y-3 rounded-2xl bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {hasPaidPlan ? <Users className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Gerenciar Equipe</p>
                  <p className="text-xs text-muted-foreground">
                    Adicione garçons reais ao seu negócio
                  </p>
                </div>
              </div>

              {hasPaidPlan ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    toast.info("Em breve: gerenciar garçons direto pelo app")
                  }
                >
                  Gerenciar garçons
                </Button>
              ) : (
                <div className="space-y-3 rounded-xl border border-dashed border-border bg-background/40 p-3">
                  <ul className="space-y-1 text-xs text-foreground">
                    <li>
                      <span className="font-semibold">Plano Padrão</span> — até 3 garçons ·{" "}
                      <span className="text-muted-foreground">R$ 49,90/mês</span>
                    </li>
                    <li>
                      <span className="font-semibold">Plano Profissional</span> — até 8 garçons ·{" "}
                      <span className="text-muted-foreground">R$ 79,90/mês</span>
                    </li>
                  </ul>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const email = user?.email ?? "";
                      const text = `Olá! Quero fazer upgrade do FluxoComanda para adicionar garçons. Meu email: ${email}`;
                      const url = `https://wa.me/5594999553574?text=${encodeURIComponent(text)}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    💬 Fazer upgrade via WhatsApp →
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Modo Demonstração — só para admin */}
          {isAdmin && (
            <section className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  Modo Demonstração
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Garçom demo disponível para você testar o fluxo limitado.
              </p>
              <div className="rounded-lg bg-card p-3 text-sm">
                <p className="text-muted-foreground">
                  Email:{" "}
                  <span className="font-mono text-foreground">
                    garcom.demo@fluxocomanda.app
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Senha: <span className="font-mono text-foreground">Demo@2026</span>
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Disponível nos planos Padrão, Profissional e Ilimitado.
              </p>
            </section>
          )}

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
    </AppShell>
  );
}
