-- Revogar privilégios de execução padrão de funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.is_master_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_master_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_master_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_master_account() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
