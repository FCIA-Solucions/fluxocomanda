-- ============================================================
-- FluxoComanda — Padronizar status de comanda fechada
-- Execute no SQL Editor:
-- https://supabase.com/dashboard/project/gessdgkkbpsuvykvokqd/sql/new
-- ============================================================

-- Padroniza qualquer registro antigo que tenha sido salvo como 'fechada'
update public.orders
   set status = 'closed'
 where status = 'fechada';

-- Verificação rápida (deve retornar apenas 'open' e 'closed')
-- select status, count(*) from public.orders group by status;
