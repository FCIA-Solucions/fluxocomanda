-- =====================================================================
-- FIX: Padronizar status de comanda para 'closed'
--
-- ATENÇÃO: a tabela do projeto chama-se "orders" (minúsculo, sem aspas),
-- NÃO "Ordens". O nome com aspas e maiúscula causa "relation does not
-- exist". O script abaixo usa o nome correto.
--
-- COMO RODAR:
-- 1. Abra: https://supabase.com/dashboard/project/gessdgkkbpsuvykvokqd/sql/new
-- 2. Cole o conteúdo abaixo e clique em "Run".
-- =====================================================================

UPDATE public.orders
   SET status = 'closed'
 WHERE status = 'fechada';

-- (Opcional) confere se restou algum legado
SELECT status, COUNT(*) FROM public.orders GROUP BY status;
