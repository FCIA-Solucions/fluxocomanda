import { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {user && (
        <div className="fixed right-3 top-3 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            aria-label="Sair da conta"
            className="h-10 w-10 rounded-full bg-card/80 backdrop-blur hover:bg-card"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      )}
      <main className="mx-auto max-w-md px-4 pb-24 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
};
