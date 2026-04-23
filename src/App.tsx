import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/SplashScreen";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { BusinessProvider } from "@/hooks/useBusiness";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthOnlyRoute } from "@/components/AuthOnlyRoute";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Comandas from "./pages/Comandas.tsx";
import NovaComanda from "./pages/NovaComanda.tsx";
import ComandaDetalhe from "./pages/ComandaDetalhe.tsx";
import Produtos from "./pages/Produtos.tsx";
import Caixa from "./pages/Caixa.tsx";
import MeuNegocio from "./pages/MeuNegocio.tsx";
import Relatorios from "./pages/Relatorios.tsx";
import Assinatura from "./pages/Assinatura.tsx";
import NotFound from "./pages/NotFound.tsx";
import Instalar from "./pages/Instalar.tsx";

const queryClient = new QueryClient();

const SPLASH_KEY = "fc_splash_shown";

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SPLASH_KEY) !== "1";
  });

  const handleSplashDone = () => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setShowSplash(false);
  };

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <BusinessProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<Index />} />
                <Route path="/assinatura" element={<AuthOnlyRoute><Assinatura /></AuthOnlyRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/comandas" element={<ProtectedRoute><Comandas /></ProtectedRoute>} />
                <Route path="/comandas/nova" element={<ProtectedRoute><NovaComanda /></ProtectedRoute>} />
                <Route path="/comandas/:id" element={<ProtectedRoute><ComandaDetalhe /></ProtectedRoute>} />
                <Route path="/produtos" element={<ProtectedRoute><Produtos /></ProtectedRoute>} />
                <Route path="/caixa" element={<ProtectedRoute><Caixa /></ProtectedRoute>} />
                <Route path="/meu-negocio" element={<ProtectedRoute><MeuNegocio /></ProtectedRoute>} />
                <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BusinessProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
