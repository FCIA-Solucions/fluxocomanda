-- =====================================================================
-- FluxoComanda — Clientes integrados às comandas
-- Rode este SQL no Supabase → SQL Editor
-- =====================================================================

-- 1) Garantir colunas/índices úteis na tabela customers (já existente)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS apelido  text;

CREATE INDEX IF NOT EXISTS idx_customers_user_id   ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_nome      ON public.customers (lower(nome));
CREATE INDEX IF NOT EXISTS idx_customers_apelido   ON public.customers (lower(apelido));
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp  ON public.customers (whatsapp);

-- 2) Vincular comanda a cliente (opcional — pode ser NULL)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
