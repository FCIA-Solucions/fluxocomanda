-- CONFIGURAÇÃO FINAL DA CONTA MASTER VITALÍCIA
-- E-mail: blindadoemotivado@gmail.com

-- 1. Promover conta existente para Superadmin Vitalício (Backend)
-- Obs: Se a conta for criada após este script, a trigger handle_new_user já cuidará disso.
UPDATE public.profiles 
SET 
    role = 'superadmin', 
    subscription_status = 'active', 
    subscription_expires_at = now() + interval '100 years',
    trial_ends_at = now() + interval '100 years'
WHERE lower(email) = 'blindadoemotivado@gmail.com';

-- 2. Garantir que a conta master tenha privilégios totais via RLS (Backend)
-- Este passo já foi automatizado via migração no banco.

-- 3. Verificação de Acesso no Frontend (Auto-cura e Hooks)
-- O sistema já possui bypass no useSubscription e useProfile.

-- SQL consolidado para auditoria futura:
/*
CREATE OR REPLACE FUNCTION public.is_master_account() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND lower(email) = 'blindadoemotivado@gmail.com'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "Master full access profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_master_account());
CREATE POLICY "Master full access products" ON public.products FOR ALL TO authenticated USING (public.is_master_account());
CREATE POLICY "Master full access orders" ON public.orders FOR ALL TO authenticated USING (public.is_master_account());
CREATE POLICY "Master full access customers" ON public.customers FOR ALL TO authenticated USING (public.is_master_account());
*/
