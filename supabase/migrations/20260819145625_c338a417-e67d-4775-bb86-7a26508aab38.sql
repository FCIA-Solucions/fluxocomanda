-- Adicionar colunas faltantes em orders para suportar "Vendas Guardadas" (Pendente/Fiado)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guardada_em timestamptz,
  ADD COLUMN IF NOT EXISTS guardada_obs text;

-- Atualizar status da comanda para incluir 'guardada' caso não tenha sido incluído
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check'
  ) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('open', 'closed', 'guardada'));
  ELSE
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('open', 'closed', 'guardada'));
  END IF;
END $$;
