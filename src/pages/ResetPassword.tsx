import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const passwordSchema = z
  .object({
    password: z.string().min(6, "Senha deve ter ao menos 6 caracteres").max(100),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não conferem",
    path: ["confirm"],
  });

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    // Supabase entrega o token de recovery no hash da URL e dispara
    // o evento PASSWORD_RECOVERY assim que processa a sessão.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // fallback: se já há sessão (usuário voltou à página), libera o form
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast({
        title: "Verifique os dados",
        description: parsed.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Não foi possível atualizar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Senha atualizada!", description: "Faça login com a nova senha." });
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/icon-192.png"
            alt="Logo"
            className="mx-auto mb-4 h-16 w-16 rounded-2xl"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Redefinir senha
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha uma nova senha para acessar sua conta
          </p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-xl">
          {!ready ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Validando seu link de recuperação...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ height: 52 }}
                  className="text-base"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={{ height: 52 }}
                  className="text-base"
                  placeholder="Repita a nova senha"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full text-base font-semibold"
                style={{ height: 56 }}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
