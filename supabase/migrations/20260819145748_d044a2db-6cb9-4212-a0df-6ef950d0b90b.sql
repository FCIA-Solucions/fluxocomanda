-- Revogar acesso de anon às funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.fechar_comanda(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_fcia_admin() FROM anon;
