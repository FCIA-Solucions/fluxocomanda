import { NavLink } from "react-router-dom";
import { Home, ClipboardList, Package, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/comandas", label: "Comandas", icon: ClipboardList },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/caixa", label: "Caixa", icon: Wallet },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex min-h-touch flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
