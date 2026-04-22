import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.name ?? user.email?.split("@")[0] ?? "");
      });
  }, [user]);

  return (
    <AppShell>
      <header className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Bem-vindo</p>
          <h1 className="text-2xl font-bold text-foreground">Olá, {name || "..."} 👋</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair" className="min-h-touch min-w-touch">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <section className="rounded-2xl bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Painel</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Em breve: comandas abertas, vendas do dia e atalhos rápidos.
        </p>
      </section>
    </AppShell>
  );
}
