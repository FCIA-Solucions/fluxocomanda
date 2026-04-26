// Configuracoes de assinatura - leem do build env (VITE_*) com fallback.
export const SUBSCRIPTION_PRICE_BRL = 39;

export const PIX_KEY =
  (import.meta.env.VITE_PIX_KEY as string | undefined) ??
  "37d3a69e-a428-43ab-8b47-5dffc6bc88c9";

export const WHATSAPP_NUMBER =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ??
  "5594999553574";

export const WHATSAPP_MESSAGE =
  (import.meta.env.VITE_WHATSAPP_MESSAGE as string | undefined) ??
  "Ola! Quero renovar minha assinatura do FluxoComanda.";

export const ADMIN_EMAIL =
  (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ??
  "blindadoemotivado@gmail.com";

export function buildWhatsappLink(message?: string) {
  const num = WHATSAPP_NUMBER.replace(/\D/g, "");
  const text = encodeURIComponent(message ?? WHATSAPP_MESSAGE);
  return num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`;
}
