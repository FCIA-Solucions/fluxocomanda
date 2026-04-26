-- Adiciona a coluna 'categoria' na tabela products (se ainda não existir)
-- Valores aceitos pelo app: 'bebidas', 'comidas', 'outros'

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'outros';

-- (Opcional) Restringe os valores possíveis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_categoria_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_categoria_check
      CHECK (categoria IN ('bebidas', 'comidas', 'outros'));
  END IF;
END $$;

-- Índice para filtros por categoria
CREATE INDEX IF NOT EXISTS idx_products_categoria ON public.products(categoria);
