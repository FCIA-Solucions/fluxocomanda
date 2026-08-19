-- Revogar acesso público de funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.fechar_comanda(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fechar_comanda(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_fcia_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_fcia_admin() TO authenticated;
