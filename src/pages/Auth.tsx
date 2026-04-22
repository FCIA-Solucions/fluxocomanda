import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const signInSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres").max(100),
});

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres").max(100),
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // signin form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup form state
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({ title: "Verifique os dados", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setSubmitting(false);
    if (error) {
      toast({ title: "Não foi possível entrar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Bem-vindo de volta!" });
    navigate("/dashboard", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({ name: suName, email: suEmail, password: suPassword });
    if (!parsed.success) {
      toast({ title: "Verifique os dados", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(parsed.data.name, parsed.data.email, parsed.data.password);
    setSubmitting(false);
    if (error) {
      const msg = error.message.includes("already") ? "Este email já está cadastrado." : error.message;
      toast({ title: "Não foi possível criar a conta", description: msg, variant: "destructive" });
      return;
    }
    toast({ title: "Conta criada!", description: "Você já pode entrar." });
    setTab("signin");
    setEmail(parsed.data.email);
    setPassword("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">FluxoComanda</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gestão de comandas e caixa</p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-xl">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-13 text-base"
                    style={{ height: 52 }}
                    placeholder="voce@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ height: 52 }}
                    className="text-base"
                    placeholder="••••••"
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full text-base font-semibold" style={{ height: 56 }}>
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    value={suName}
                    onChange={(e) => setSuName(e.target.value)}
                    style={{ height: 52 }}
                    className="text-base"
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    style={{ height: 52 }}
                    className="text-base"
                    placeholder="voce@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={suPassword}
                    onChange={(e) => setSuPassword(e.target.value)}
                    style={{ height: 52 }}
                    className="text-base"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full text-base font-semibold" style={{ height: 56 }}>
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
