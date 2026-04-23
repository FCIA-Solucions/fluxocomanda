import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "garcom";

export interface ProfileState {
  role: AppRole;
  ownerId: string | null;
  email: string | null;
  /** ID do dono efetivo: para admin é o próprio user.id; para garçom é owner_id. */
  effectiveUserId: string | null;
  loading: boolean;
}

interface ProfileContextValue extends ProfileState {
  refresh: () => Promise<void>;
}

const defaultState: ProfileState = {
  role: "admin",
  ownerId: null,
  email: null,
  effectiveUserId: null,
  loading: true,
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<ProfileState>(defaultState);

  const refresh = useCallback(async () => {
    if (!user) {
      setState({ ...defaultState, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const { data } = await supabase
      .from("profiles")
      .select("role, owner_id, email")
      .eq("id", user.id)
      .maybeSingle();

    const role: AppRole = (data?.role as AppRole) ?? "admin";
    const ownerId = data?.owner_id ?? null;
    setState({
      role,
      ownerId,
      email: data?.email ?? user.email ?? null,
      effectiveUserId: ownerId ?? user.id,
      loading: false,
    });
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  return (
    <ProfileContext.Provider value={{ ...state, refresh }}>
      {children}
    </ProfileContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
};
