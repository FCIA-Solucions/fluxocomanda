import { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { HelpButton } from "./help/HelpButton";

interface PageHeaderProps {
  /** Conteúdo à esquerda. Se omitido, usa `title`/`subtitle`. */
  left?: ReactNode;
  title?: string;
  subtitle?: string;
  /** Ações extras à direita (antes dos ícones globais). */
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({ left, title, subtitle, actions, className }: PageHeaderProps) => {
  const { user, signOut } = useAuth();

  return (
    <header
      className={`mb-6 flex items-center justify-between gap-3 ${className ?? ""}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {left ?? (
          <div className="min-w-0">
            {subtitle && (
              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
            )}
            {title && (
              <h1 className="truncate text-2xl font-bold text-foreground">{title}</h1>
            )}
          </div>
        )}
      </div>

      {user && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <HelpButton />
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
    </header>
  );
};
