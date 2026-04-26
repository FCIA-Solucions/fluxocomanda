-- =====================================================================
-- AUDITORIA: garantir que NÃO existe fechamento automático de comandas
--
-- Rode este script no SQL Editor do Supabase para verificar e remover
-- qualquer cron job, trigger ou função que feche comandas automaticamente.
--
-- 1) Abra: https://supabase.com/dashboard/project/_/sql/new
-- 2) Cole tudo e clique em "Run"
-- =====================================================================

-- 1) Listar jobs do pg_cron (se a extensão estiver ativa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron está instalado. Veja a tabela cron.job:';
    PERFORM 1;
  ELSE
    RAISE NOTICE 'pg_cron NÃO está instalado. Nenhum job agendado possível.';
  END IF;
END $$;

-- Se pg_cron existir, este SELECT mostra os jobs:
-- SELECT jobid, schedule, command, active FROM cron.job;
-- Para remover qualquer job suspeito:
-- SELECT cron.unschedule(<jobid>);

-- 2) Listar triggers nas tabelas críticas (orders / sales / cash_closures)
SELECT
  event_object_table AS tabela,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('orders', 'sales', 'cash_closures')
ORDER BY tabela, trigger_name;

-- 3) Listar funções que possam atualizar status='closed' automaticamente
SELECT
  n.nspname AS schema,
  p.proname AS funcao,
  pg_get_functiondef(p.oid) AS definicao
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%status%closed%'
  AND p.proname <> 'fechar_comanda';

-- 4) Conferir se existe alguma comanda fechada SEM venda registrada
--    (sintoma típico de fechamento automático defeituoso)
SELECT o.id, o.customer_name, o.status, o.closed_at, o.total
FROM public.orders o
LEFT JOIN public.sales s ON s.order_id = o.id
WHERE o.status = 'closed'
  AND s.id IS NULL
ORDER BY o.closed_at DESC NULLS LAST
LIMIT 50;
