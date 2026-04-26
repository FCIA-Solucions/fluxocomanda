import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_EMAIL } from "@/lib/subscriptionConfig";

export type SubscriptionStatus = "trial" | "active" | "expired";

export interface SubscriptionState {
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  subscriptionExpiresAt: Date | null;
  /** Dias restantes (arredondado para cima). 0 ou negativo se vencido. */
  daysLeft: number;
  /** Qual data está sendo considerada para daysLeft: 'trial' ou 'active'. */
  source: "trial" | "active" | "none";
  /** True quando o acesso ao app deve ser bloqueado (status = 'expired' e não é admin). */
  isBlocked: boolean;
  loading: boolean;
}

interface SubscriptionContextValue extends SubscriptionState {
  refresh: () => Promise<void>;
}

const defaultState: SubscriptionState = {
  status: "trial",
  trialEndsAt: null,
  subscriptionExpiresAt: null,
  daysLeft: 0,
  source: "none",
  isBlocked: false,
  loading: true,
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

function computeStatus(
  trialEndsAt: Date | null,
  subscriptionExpiresAt: Date | null,
  hasAnyField: boolean
): { status: SubscriptionStatus; daysLeft: number; source: "trial" | "active" | "none" } {
  // Usuário novo (todos os campos vazios) → trial livre
  if (!hasAnyField) {
    return { status: "trial", daysLeft: 7, source: "trial" };
  }

  const now = Date.now();
  const trialMs = trialEndsAt ? trialEndsAt.getTime() - now : -1;
  const subMs = subscriptionExpiresAt ? subscriptionExpiresAt.getTime() - now : -1;

  // Assinatura ativa tem prioridade sobre trial
  if (subMs > 0) {
    return { status: "active", daysLeft: Math.ceil(subMs / 86400000), source: "active" };
  }
  if (trialMs > 0) {
    return { status: "trial", daysLeft: Math.ceil(trialMs / 86400000), source: "trial" };
  }
  return { status: "expired", daysLeft: 0, source: "none" };
}

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<SubscriptionState>(defaultState);

  const refresh = useCallback(async () => {
    if (!user) {
      setState({ ...defaultState, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const { data } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_expires_at, trial_ends_at, role")
      .eq("id", user.id)
      .maybeSingle();

    const trialEndsAt = data?.trial_ends_at ? new Date(data.trial_ends_at) : null;
    const subExpires = data?.subscription_expires_at ? new Date(data.subscription_expires_at) : null;
    const hasAnyField = !!(data?.subscription_status || trialEndsAt || subExpires);
    const computed = computeStatus(trialEndsAt, subExpires, hasAnyField);

    // Bypass: e-mail admin OU role superadmin no banco
    const userEmail = user.email?.trim().toLowerCase() ?? "";
    const adminEmail = ADMIN_EMAIL?.trim().toLowerCase() ?? "";
    const isAdminEmail = !!adminEmail && userEmail === adminEmail;
    const isSuperadmin = (data as { role?: string } | null)?.role === "superadmin";
    const isAdmin = isAdminEmail || isSuperadmin;
    const isBlocked = !isAdmin && computed.status === "expired";

    setState({
      status: computed.status,
      daysLeft: computed.daysLeft,
      source: computed.source,
      trialEndsAt,
      subscriptionExpiresAt: subExpires,
      isBlocked,
      loading: false,
    });
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  return (
    <SubscriptionContext.Provider value={{ ...state, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
};
