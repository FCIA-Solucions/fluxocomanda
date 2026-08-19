import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_BRAND_COLOR, hexToHslString } from "@/lib/colorUtils";

export interface BusinessProfile {
  business_name: string | null;
  logo_url: string | null;
  brand_color: string;
  printer_width: string;
}

interface BusinessContextValue {
  business: BusinessProfile;
  loading: boolean;
  refresh: () => Promise<void>;
  setLocal: (patch: Partial<BusinessProfile>) => void;
}

const defaultBusiness: BusinessProfile = {
  business_name: null,
  logo_url: null,
  brand_color: DEFAULT_BRAND_COLOR,
  printer_width: "80mm",
};

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

function applyBrandColor(hex: string) {
  const hsl = hexToHslString(hex || DEFAULT_BRAND_COLOR);
  const root = document.documentElement;
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--sidebar-primary", hsl);
  root.style.setProperty("--sidebar-ring", hsl);
}

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<BusinessProfile>(defaultBusiness);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setBusiness(defaultBusiness);
      applyBrandColor(DEFAULT_BRAND_COLOR);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("business_name, logo_url, brand_color, printer_width")
      .eq("id", user.id)
      .maybeSingle();
    const next: BusinessProfile = {
      business_name: data?.business_name ?? null,
      logo_url: data?.logo_url ?? null,
      brand_color: data?.brand_color ?? DEFAULT_BRAND_COLOR,
      printer_width: data?.printer_width ?? "80mm",
    };
    setBusiness(next);
    applyBrandColor(next.brand_color);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setLocal = useCallback((patch: Partial<BusinessProfile>) => {
    setBusiness((prev) => {
      const next = { ...prev, ...patch };
      if (patch.brand_color) applyBrandColor(patch.brand_color);
      return next;
    });
  }, []);

  return (
    <BusinessContext.Provider value={{ business, loading, refresh, setLocal }}>
      {children}
    </BusinessContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBusiness = () => {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
};
