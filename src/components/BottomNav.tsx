import { NavLink } from "react-router-dom";
import { Home, ClipboardList, Package, Wallet, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

const adminTabs = [
  { to: "/dashboard", label: "Início", icon: Home, end: true },
  { to: "/comandas", label: "Comandas", icon: ClipboardList, end: false },
  { to: "/produtos", label: "Produtos", icon: Package, end: false },
  { to: "/caixa", label: "Caixa", icon: Wallet, end: false },
  { to: "/meu-negocio", label: "Negócio", icon: Store, end: false },
];

const garcomTabs = [
  { to: "/comandas", label: "Comandas", icon: ClipboardList, end: false },
];

export const BottomNav = () => {
  const { role } = useProfile();
  const tabs = role === "garcom" ? garcomTabs : adminTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-touch flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors",
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
