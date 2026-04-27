-- =====================================================================
-- FluxoComanda: deletar contas de teste do Fernando
--   - fernandocabraldafonseca@gmail.com
--   - prof.fernndocabral@gmail.com
--
-- COMO RODAR:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Cole este arquivo inteiro e execute
--
-- O DELETE em auth.users dispara CASCADE e remove o profile e todos
-- os dados ligados (comandas, produtos, clientes etc.) por causa das
-- foreign keys com ON DELETE CASCADE.
-- =====================================================================

-- 1) Conferir antes de apagar
select id, email, created_at
from auth.users
where email in (
  'fernandocabraldafonseca@gmail.com',
  'prof.fernndocabral@gmail.com'
);

-- 2) Apagar dados de aplicação ligados ao owner (caso CASCADE não cubra tudo)
do $$
declare
  uid uuid;
begin
  for uid in
    select id from auth.users
    where email in (
      'fernandocabraldafonseca@gmail.com',
      'prof.fernndocabral@gmail.com'
    )
  loop
    delete from public.cash_closures      where owner_id = uid or user_id = uid;
    delete from public.order_items        where owner_id = uid;
    delete from public.orders             where owner_id = uid or user_id = uid;
    delete from public.products           where owner_id = uid or user_id = uid;
    delete from public.customers          where owner_id = uid or user_id = uid;
    delete from public.profiles           where owner_id = uid;
    delete from public.profiles           where id = uid;
  end loop;
end $$;

-- 3) Apagar o usuário do Auth (remove login)
delete from auth.users
where email in (
  'fernandocabraldafonseca@gmail.com',
  'prof.fernndocabral@gmail.com'
);

-- 4) Conferir — deve voltar 0 linhas
select id, email
from auth.users
where email in (
  'fernandocabraldafonseca@gmail.com',
  'prof.fernndocabral@gmail.com'
);
