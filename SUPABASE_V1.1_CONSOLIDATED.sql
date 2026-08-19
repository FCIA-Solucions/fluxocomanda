-- ============================================================
-- FluxoComanda v1.1 — Schema de Reconstrução Consolidado
-- Data: 2026-08-19
-- ============================================================

-- 1) PROFILES -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  business_name text,
  logo_url text,
  brand_color text NOT NULL DEFAULT '#22c55e',
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'garcom', 'superadmin')),
  subscription_status text NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired')),
  subscription_expires_at timestamptz,
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2) PRODUCTS -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  cost numeric(10,2) CHECK (cost IS NULL OR cost >= 0),
  active boolean NOT NULL DEFAULT true,
  categoria text NOT NULL DEFAULT 'outros' CHECK (categoria IN ('bebidas', 'comidas', 'outros')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_own" ON public.products FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "products_insert_own" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "products_update_own" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "products_delete_own" ON public.products FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON public.products(categoria);

-- 3) CUSTOMERS ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  apelido text,
  whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_own" ON public.customers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "customers_insert_own" ON public.customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_update_own" ON public.customers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "customers_delete_own" ON public.customers FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_nome ON public.customers (lower(nome));

-- 4) ORDERS (comandas) ---------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'guardada')),
  total numeric(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_method text CHECK (payment_method IN ('dinheiro', 'pix', 'cartao')),
  guardada_em timestamptz,
  guardada_obs text,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_own" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "orders_delete_own" ON public.orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- 5) ORDER_ITEMS ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE POLICY "order_items_update_own" ON public.order_items FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE POLICY "order_items_delete_own" ON public.order_items FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 6) SALES ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  payment_method text CHECK (payment_method IN ('dinheiro', 'pix', 'cartao')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_select_own" ON public.sales FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sales_insert_own" ON public.sales FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);

-- 7) CASH_CLOSURES -------------------------------------------
CREATE TABLE IF NOT EXISTS public.cash_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  closed_at timestamptz NOT NULL DEFAULT now(),
  business_day date NOT NULL,
  type text NOT NULL CHECK (type IN ('manual', 'auto')),
  closed_by_name text,
  total numeric(12,2) NOT NULL DEFAULT 0,
  total_dinheiro numeric(12,2) NOT NULL DEFAULT 0,
  total_pix numeric(12,2) NOT NULL DEFAULT 0,
  total_cartao numeric(12,2) NOT NULL DEFAULT 0,
  sales_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_closures TO authenticated;
GRANT ALL ON public.cash_closures TO service_role;

ALTER TABLE public.cash_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own closures" ON public.cash_closures FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own closures" ON public.cash_closures FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own closures" ON public.cash_closures FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS cash_closures_user_day_uniq ON public.cash_closures (user_id, business_day);

-- 8) FUNCTIONS & TRIGGERS ------------------------------------

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, trial_ends_at, subscription_status)
  VALUES (
    new.id,
    new.email,
    'admin',
    now() + interval '7 days',
    'trial'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- fechar_comanda (Atomic RPC)
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

REVOKE ALL ON FUNCTION public.fechar_comanda(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fechar_comanda(uuid, text) TO authenticated;

-- is_fcia_admin helper
CREATE OR REPLACE FUNCTION public.is_fcia_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) = 'blindadoemotivado@gmail.com'
  );
$$ LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public;

CREATE POLICY "FCIA admin can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_fcia_admin());
CREATE POLICY "FCIA admin can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_fcia_admin()) WITH CHECK (public.is_fcia_admin());

-- Reset Today (Utility)
CREATE OR REPLACE FUNCTION public.reset_today()
RETURNS json AS $$
DECLARE
  uid uuid := auth.uid();
  day_start timestamptz := (date_trunc('day', (now() at time zone 'America/Sao_Paulo'))) at time zone 'America/Sao_Paulo';
  day_end   timestamptz := day_start + interval '1 day';
  bd date := (now() at time zone 'America/Sao_Paulo')::date;
  v_sales int := 0;
  v_orders int := 0;
  v_items int := 0;
  v_closures int := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  WITH del_items AS (
    DELETE FROM public.order_items oi
    USING public.orders o
    WHERE oi.order_id = o.id
      AND o.user_id = uid
      AND o.created_at >= day_start
      AND o.created_at <  day_end
    RETURNING oi.id
  ) SELECT count(*) INTO v_items FROM del_items;

  WITH del_sales AS (
    DELETE FROM public.sales
    WHERE user_id = uid
      AND created_at >= day_start
      AND created_at <  day_end
    RETURNING id
  ) SELECT count(*) INTO v_sales FROM del_sales;

  WITH del_orders AS (
    DELETE FROM public.orders
    WHERE user_id = uid
      AND created_at >= day_start
      AND created_at <  day_end
    RETURNING id
  ) SELECT count(*) INTO v_orders FROM del_orders;

  WITH del_cl AS (
    DELETE FROM public.cash_closures
    WHERE user_id = uid
      AND business_day = bd
    RETURNING id
  ) SELECT count(*) INTO v_closures FROM del_cl;

  RETURN json_build_object(
    'sales_deleted', v_sales,
    'orders_deleted', v_orders,
    'items_deleted', v_items,
    'closures_deleted', v_closures
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.reset_today() TO authenticated;
