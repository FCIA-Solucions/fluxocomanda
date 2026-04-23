-- =====================================================================
-- RPC ATÔMICA: fechar_comanda
-- Substitui o fechamento simples de comanda por uma transação única.
-- Em caso de qualquer erro, todo o fechamento é revertido (rollback).
--
-- COMO RODAR:
-- 1. Abra o Supabase SQL Editor:
--    https://supabase.com/dashboard/project/gessdgkkbpsuvykvokqd/sql/new
-- 2. Cole TODO o conteúdo abaixo e clique em "Run"
-- =====================================================================

CREATE OR REPLACE FUNCTION public.fechar_comanda(
  p_order_id uuid,
  p_payment_method text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_order   public.orders%ROWTYPE;
  v_total   numeric;
  v_now     timestamptz := now();
BEGIN
  -- 1) Autenticação
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado' USING ERRCODE = '28000';
  END IF;

  -- 2) Validar forma de pagamento
  IF p_payment_method NOT IN ('dinheiro', 'pix', 'cartao') THEN
    RAISE EXCEPTION 'Forma de pagamento inválida' USING ERRCODE = '22023';
  END IF;

  -- 3) Buscar comanda com lock para evitar fechamento concorrente
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comanda não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status = 'closed' THEN
    RAISE EXCEPTION 'Comanda já está fechada' USING ERRCODE = 'P0001';
  END IF;

  -- 4) Calcular total atual a partir dos itens (fonte da verdade)
  SELECT COALESCE(SUM(subtotal), 0)
    INTO v_total
  FROM public.order_items
  WHERE order_id = p_order_id;

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'Comanda sem itens' USING ERRCODE = 'P0001';
  END IF;

  -- 5) Registrar a venda (sales)
  INSERT INTO public.sales (user_id, order_id, total, payment_method)
  VALUES (v_user_id, p_order_id, v_total, p_payment_method);

  -- 6) Atualizar a comanda
  UPDATE public.orders
     SET status         = 'closed',
         closed_at      = v_now,
         payment_method = p_payment_method,
         total          = v_total
   WHERE id = p_order_id;

  -- 7) Retorno
  RETURN jsonb_build_object(
    'success',        true,
    'order_id',       p_order_id,
    'total',          v_total,
    'payment_method', p_payment_method,
    'closed_at',      v_now
  );

EXCEPTION
  WHEN OTHERS THEN
    -- PostgreSQL faz rollback automático da transação da função.
    RAISE;
END;
$$;

-- Permissões
REVOKE ALL ON FUNCTION public.fechar_comanda(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fechar_comanda(uuid, text) TO authenticated;
