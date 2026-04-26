// Configurações de assinatura — leem do build env (VITE_*) com fallback robusto.
// Trata string vazia como "ausente" (??  do JS só cai no fallback com undefined/null).
function envOr(key: string, fallback: string): string {
  const raw = (import.meta.env[key] as string | undefined)?.trim();
  return raw && raw.length > 0 ? raw : fallback;
}

export const SUBSCRIPTION_PRICE_BRL = 39;

export const PIX_KEY = envOr("VITE_PIX_KEY", "37d3a69e-a428-43ab-8b47-5dffc6bc88c9");

export const WHATSAPP_NUMBER = envOr("VITE_WHATSAPP_NUMBER", "5594999553574");

export const WHATSAPP_MESSAGE = envOr(
  "VITE_WHATSAPP_MESSAGE",
  "Olá! Quero renovar minha assinatura do FluxoComanda."
);

/** E-mail do dono / admin que nunca é bloqueado pela tela de assinatura. */
export const ADMIN_EMAIL = envOr("VITE_ADMIN_EMAIL", "blindadoemotivado@gmail.com");

export function buildWhatsappLink(message?: string) {
  const num = WHATSAPP_NUMBER.replace(/\D/g, "");
  const text = encodeURIComponent(message ?? WHATSAPP_MESSAGE);
  return num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`;
}
