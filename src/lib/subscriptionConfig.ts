export const PIX_KEY =
  (import.meta.env.VITE_PIX_KEY as string | undefined) ??
  "37d3a69e-a428-43ab-8b47-5dffc6bc88c9";

export const WHATSAPP_NUMBER =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ??
  "5594999553574";

export const ADMIN_EMAIL =
  (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim() ||
  "blindadoemotivado@gmail.com";

export const PLANS = {
  trial: {
    id: "trial",
    nome: "Trial",
    preco: 0,
    precoLabel: "Grátis",
    subtitulo: "7 dias completos",
    badge: "Sem risco",
    destaque: false,
    beneficios: [
      "Acesso completo ao sistema",
      "Sem cartão de crédito",
      "Cancele quando quiser",
    ],
    mensagemWhatsapp: "Olá! Quero começar meu trial grátis do FluxoComanda.",
  },
  mensal: {
    id: "mensal",
    nome: "Mensal",
    preco: 49,
    precoLabel: "R$ 49/mês",
    subtitulo: "Renovação todo mês",
    badge: null,
    destaque: false,
    beneficios: [
      "Tudo do trial",
      "Suporte via WhatsApp",
      "Garçons ilimitados",
      "Relatórios de venda",
    ],
    mensagemWhatsapp: "Olá! Quero assinar o plano Mensal do FluxoComanda (R$ 49/mês).",
  },
  semestral: {
    id: "semestral",
    nome: "Semestral",
    preco: 197,
    precoLabel: "R$ 197",
    subtitulo: "equivale a R$ 33/mês — você economiza R$ 97",
    badge: "⭐ Mais escolhido",
    destaque: true,
    beneficios: [
      "Tudo do plano mensal",
      "6 meses de acesso garantido",
      "Prioridade no suporte",
      "Atualizações incluídas",
    ],
    mensagemWhatsapp: "Olá! Quero assinar o plano Semestral do FluxoComanda (R$ 197).",
  },
  vitalicio: {
    id: "vitalicio",
    nome: "Vitalício",
    preco: null,
    precoLabel: "Sob consulta",
    subtitulo: "Pague uma vez, use para sempre",
    badge: "Exclusivo",
    destaque: false,
    beneficios: [
      "Acesso permanente",
      "Todas as atualizações futuras",
      "Suporte prioritário",
      "Condições especiais via WhatsApp",
    ],
    mensagemWhatsapp: "Olá! Tenho interesse no plano Vitalício do FluxoComanda. Pode me passar mais informações?",
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const WHATSAPP_MESSAGE =
  (import.meta.env.VITE_WHATSAPP_MESSAGE as string | undefined) ??
  "Olá! Quero assinar o FluxoComanda.";

export function buildWhatsappLink(message?: string) {
  const num = WHATSAPP_NUMBER.replace(/\D/g, "");
  const text = encodeURIComponent(message ?? WHATSAPP_MESSAGE);
  return num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function buildPlanWhatsappLink(planId: PlanId) {
  const msg = PLANS[planId].mensagemWhatsapp;
  return buildWhatsappLink(msg);
}

export const SUBSCRIPTION_PRICE_BRL = 49;
