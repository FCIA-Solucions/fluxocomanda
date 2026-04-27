-- =====================================================================
-- FluxoComanda: deletar contas de teste
--   - fernandocabraldafonseca@gmail.com
--   - prof.fernndocabral@gmail.com
--
-- Observação: nas tabelas de dados (orders, products, customers,
-- cash_closures, sales) a coluna que liga ao dono é `user_id`.
-- Apenas `profiles` tem `owner_id` (para garçons vinculados ao admin).
-- =====================================================================

-- 1) Conferir antes de apagar
select id, email, created_at
from auth.users
where email in (
  'fernandocabraldafonseca@gmail.com',
  'prof.fernndocabral@gmail.com'
);

-- 2) Apagar dados de aplicação ligados ao usuário
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
    delete from public.order_items
      where order_id in (select id from public.orders where user_id = uid);
    delete from public.cash_closures where user_id = uid;
    delete from public.sales         where user_id = uid;
    delete from public.orders        where user_id = uid;
    delete from public.products      where user_id = uid;
    delete from public.customers     where user_id = uid;
    delete from public.profiles      where owner_id = uid;
    delete from public.profiles      where id = uid;
  end loop;
end $$;

-- 3) Apagar o usuário do Auth (remove o login)
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
