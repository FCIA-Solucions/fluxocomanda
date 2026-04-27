-- ============================================================
-- FluxoComanda — Múltiplos Admins (superadmins)
-- Execute no Supabase → SQL Editor
-- https://supabase.com/dashboard/project/gessdgkkbpsuvykvokqd/sql/new
-- ============================================================

-- 1) Garante que a coluna 'role' aceita 'superadmin'
--    (caso já exista um CHECK constraint restringindo valores)
DO $$
BEGIN
  -- remove constraints antigas, se houverem, com nomes comuns
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END$$;

-- (não recriamos CHECK — deixamos a coluna como text livre,
--  os valores válidos são 'admin' | 'garcom' | 'superadmin')

-- 2) Atualiza is_fcia_admin(): true se o usuário logado é superadmin
--    OU se é o e-mail mestre (fallback de emergência)
CREATE OR REPLACE FUNCTION public.is_fcia_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = auth.uid()
      AND (
        p.role = 'superadmin'
        OR lower(u.email) = 'blindadoemotivado@gmail.com'
      )
  );
$$;

-- 3) Garante as policies do painel admin (idempotente)
DROP POLICY IF EXISTS "FCIA admin can view all profiles" ON public.profiles;
CREATE POLICY "FCIA admin can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_fcia_admin());

DROP POLICY IF EXISTS "FCIA admin can update all profiles" ON public.profiles;
CREATE POLICY "FCIA admin can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_fcia_admin())
  WITH CHECK (public.is_fcia_admin());

-- 4) Garante que SEU usuário é superadmin (ajusta também o e-mail mestre)
UPDATE public.profiles
   SET role = 'superadmin'
 WHERE id IN (
   SELECT id FROM auth.users
   WHERE lower(email) = 'blindadoemotivado@gmail.com'
 );
