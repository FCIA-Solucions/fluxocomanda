-- =====================================================================
-- RESET DO DIA DE HOJE — apaga somente os dados do usuário autenticado
-- Apaga: vendas (sales), comandas (orders + order_items) e fechamento
-- Mantém: produtos, perfil, logo, conta
-- =====================================================================

create or replace function public.reset_today()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  -- Início do "hoje" no fuso de São Paulo, convertido para timestamptz (UTC)
  day_start timestamptz := (date_trunc('day', (now() at time zone 'America/Sao_Paulo')))
                          at time zone 'America/Sao_Paulo';
  day_end   timestamptz := day_start + interval '1 day';
  bd date := (now() at time zone 'America/Sao_Paulo')::date;
  v_sales int := 0;
  v_orders int := 0;
  v_items int := 0;
  v_closures int := 0;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- 1) Apaga itens das comandas de hoje deste usuário
  with del_items as (
    delete from public.order_items oi
    using public.orders o
    where oi.order_id = o.id
      and o.user_id = uid
      and o.created_at >= day_start
      and o.created_at <  day_end
    returning oi.id
  )
  select count(*) into v_items from del_items;

  -- 2) Apaga vendas de hoje
  with del_sales as (
    delete from public.sales
    where user_id = uid
      and created_at >= day_start
      and created_at <  day_end
    returning id
  )
  select count(*) into v_sales from del_sales;

  -- 3) Apaga comandas de hoje
  with del_orders as (
    delete from public.orders
    where user_id = uid
      and created_at >= day_start
      and created_at <  day_end
    returning id
  )
  select count(*) into v_orders from del_orders;

  -- 4) Apaga fechamento(s) de caixa de hoje
  with del_cl as (
    delete from public.cash_closures
    where user_id = uid
      and business_day = bd
    returning id
  )
  select count(*) into v_closures from del_cl;

  return json_build_object(
    'sales_deleted', v_sales,
    'orders_deleted', v_orders,
    'items_deleted', v_items,
    'closures_deleted', v_closures
  );
end;
$$;

grant execute on function public.reset_today() to authenticated;
