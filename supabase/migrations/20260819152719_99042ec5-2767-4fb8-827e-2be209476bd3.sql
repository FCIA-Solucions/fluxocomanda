-- 1. Criar função auxiliar para identificar a conta master
CREATE OR REPLACE FUNCTION public.is_master_account()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND lower(email) = 'blindadoemotivado@gmail.com'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Garantir que a conta master tenha role superadmin e expiração de 100 anos no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF lower(new.email) = 'blindadoemotivado@gmail.com' THEN
    INSERT INTO public.profiles (id, email, role, trial_ends_at, subscription_status, subscription_expires_at)
    VALUES (new.id, new.email, 'superadmin', now() + interval '100 years', 'active', now() + interval '100 years')
    ON CONFLICT (id) DO UPDATE SET 
      role = 'superadmin', 
      subscription_status = 'active', 
      subscription_expires_at = now() + interval '100 years';
  ELSE
    INSERT INTO public.profiles (id, email, role, trial_ends_at, subscription_status)
    VALUES (new.id, new.email, 'admin', now() + interval '7 days', 'trial')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Aplicar Row Level Security (RLS) para acesso irrestrito da conta Master
-- Profiles
DROP POLICY IF EXISTS "Master access profiles" ON public.profiles;
CREATE POLICY "Master access profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_master_account());

-- Products
DROP POLICY IF EXISTS "Master access products" ON public.products;
CREATE POLICY "Master access products" ON public.products FOR ALL TO authenticated USING (public.is_master_account());

-- Orders
DROP POLICY IF EXISTS "Master access orders" ON public.orders;
CREATE POLICY "Master access orders" ON public.orders FOR ALL TO authenticated USING (public.is_master_account());

-- Customers
DROP POLICY IF EXISTS "Master access customers" ON public.customers;
CREATE POLICY "Master access customers" ON public.customers FOR ALL TO authenticated USING (public.is_master_account());

-- Grants (necessário para o Supabase Data API)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.customers TO authenticated;
