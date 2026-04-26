-- ============================================================
-- Painel Admin FCIA — Acesso a todos os perfis
-- Roda no Supabase → SQL Editor
-- ============================================================

-- 1) Função helper: verifica se o usuário logado é o admin do FCIA
CREATE OR REPLACE FUNCTION public.is_fcia_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) = 'blindadoemotivado@gmail.com'
  );
$$;

-- 2) Política de SELECT: admin pode ver TODOS os perfis
DROP POLICY IF EXISTS "FCIA admin can view all profiles" ON public.profiles;
CREATE POLICY "FCIA admin can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_fcia_admin());

-- 3) Política de UPDATE: admin pode editar QUALQUER perfil
DROP POLICY IF EXISTS "FCIA admin can update all profiles" ON public.profiles;
CREATE POLICY "FCIA admin can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_fcia_admin())
  WITH CHECK (public.is_fcia_admin());
