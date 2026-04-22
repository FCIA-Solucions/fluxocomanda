// Configurações de assinatura — leem do build env (VITE_*) com fallback.
// Para personalizar, adicione em Workspace Settings → Build Secrets:
//   VITE_PIX_KEY, VITE_WHATSAPP_NUMBER, VITE_WHATSAPP_MESSAGE
export const SUBSCRIPTION_PRICE_BRL = 39;

export const PIX_KEY =
  (import.meta.env.VITE_PIX_KEY as string | undefined) ?? "";

export const WHATSAPP_NUMBER =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? "";

export const WHATSAPP_MESSAGE =
  (import.meta.env.VITE_WHATSAPP_MESSAGE as string | undefined) ??
  "Olá! Quero renovar minha assinatura do FluxoComanda.";

export function buildWhatsappLink(message?: string) {
  const num = WHATSAPP_NUMBER.replace(/\D/g, "");
  const text = encodeURIComponent(message ?? WHATSAPP_MESSAGE);
  return num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`;
}
