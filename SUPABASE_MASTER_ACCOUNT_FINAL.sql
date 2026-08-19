-- CONFIGURAÇÃO FINAL DA CONTA MASTER FLUXOCOMANDA (Vitalício & Superadmin)
-- Execute este script no SQL Editor do seu backend.

-- 1. Atualiza a função de criação automática de perfis
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF new.email = 'blindadoemotivado@gmail.com' THEN
    INSERT INTO public.profiles (
      id, 
      email, 
      role, 
      trial_ends_at, 
      subscription_status, 
      subscription_expires_at
    )
    VALUES (
      new.id, 
      new.email, 
      'superadmin', 
      now() + interval '100 years', 
      'active', 
      NULL
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'superadmin',
      subscription_status = 'active',
      subscription_expires_at = NULL;
  ELSE
    INSERT INTO public.profiles (id, email, role, trial_ends_at, subscription_status)
    VALUES (
      new.id, 
      new.email, 
      'admin', 
      now() + interval '7 days', 
      'trial'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Helper para identificar a conta master (usado em RLS)
CREATE OR REPLACE FUNCTION public.is_master_account()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND email = 'blindadoemotivado@gmail.com'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Políticas de segurança (RLS) para acesso irrestrito da Master
-- Nota: 'is_fcia_admin' já existia, mas 'is_master_account' é mais específico para esta regra.

DROP POLICY IF EXISTS "Master account has full access to all profiles" ON public.profiles;
CREATE POLICY "Master account has full access to all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_master_account())
WITH CHECK (public.is_master_account());

-- 4. Aplica as regras retroativamente se o usuário já existir
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'blindadoemotivado@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET role = 'superadmin',
            subscription_status = 'active',
            subscription_expires_at = NULL,
            trial_ends_at = now() + interval '100 years'
        WHERE id = target_user_id;
    END IF;
END $$;
