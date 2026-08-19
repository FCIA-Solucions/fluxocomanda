-- Mudança final para conformidade total de segurança (SECURITY INVOKER)
-- Exceto handle_new_user que precisa ser SECURITY DEFINER para acessar auth schema via trigger

CREATE OR REPLACE FUNCTION public.fechar_comanda(
  p_order_id uuid,
  p_payment_method text
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_order   public.orders%ROWTYPE;
  v_total   numeric;
  v_now     timestamptz := now();
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado' USING ERRCODE = '28000';
  END IF;

  IF p_payment_method NOT IN ('dinheiro', 'pix', 'cartao') THEN
    RAISE EXCEPTION 'Forma de pagamento inválida' USING ERRCODE = '22023';
  END IF;

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

  SELECT COALESCE(SUM(subtotal), 0)
    INTO v_total
  FROM public.order_items
  WHERE order_id = p_order_id;

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'Comanda sem itens' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.sales (user_id, order_id, total, payment_method)
  VALUES (v_user_id, p_order_id, v_total, p_payment_method);

  UPDATE public.orders
     SET status         = 'closed',
         closed_at      = v_now,
         payment_method = p_payment_method,
         total          = v_total
   WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success',        true,
    'order_id',       p_order_id,
    'total',          v_total,
    'payment_method', p_payment_method,
    'closed_at',      v_now
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_fcia_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) = 'blindadoemotivado@gmail.com'
  );
$$ LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public;
