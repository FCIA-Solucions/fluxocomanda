-- Fix security definer functions execute permissions
-- handle_new_user
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- fechar_comanda (already has grants, but reinforcing)
REVOKE ALL ON FUNCTION public.fechar_comanda(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fechar_comanda(uuid, text) TO authenticated;

-- is_fcia_admin
REVOKE ALL ON FUNCTION public.is_fcia_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_fcia_admin() TO authenticated;
