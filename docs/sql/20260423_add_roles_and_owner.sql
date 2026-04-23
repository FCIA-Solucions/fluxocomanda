-- =====================================================================
-- FluxoComanda: roles (admin/garcom) + multi-tenant via owner_id
--
-- COMO RODAR:
--   1. Abra o Supabase Dashboard → SQL Editor
--   2. Cole este arquivo inteiro e execute
--   3. (Opcional) Descomente o UPDATE no final para vincular o garçom-demo
-- =====================================================================

-- 1) Colunas em profiles -----------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'admin'
    check (role in ('admin', 'garcom')),
  add column if not exists owner_id uuid
    references auth.users(id) on delete cascade;

create index if not exists profiles_owner_id_idx on public.profiles(owner_id);

-- 2) Função "dono efetivo" (security definer evita recursão de RLS) ----
--    Admin → próprio id. Garçom → owner_id (id do dono).
create or replace function public.effective_owner(_uid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p.owner_id, p.id)
  from public.profiles p
  where p.id = _uid
$$;

-- 3) RLS multi-tenant --------------------------------------------------

-- ORDERS
alter table public.orders enable row level security;
drop policy if exists "orders_select_own"   on public.orders;
drop policy if exists "orders_insert_own"   on public.orders;
drop policy if exists "orders_update_own"   on public.orders;
drop policy if exists "orders_delete_own"   on public.orders;
drop policy if exists "orders_select_tenant" on public.orders;
drop policy if exists "orders_insert_tenant" on public.orders;
drop policy if exists "orders_update_tenant" on public.orders;
drop policy if exists "orders_delete_tenant" on public.orders;

create policy "orders_select_tenant" on public.orders
  for select to authenticated
  using (user_id = public.effective_owner(auth.uid()));
create policy "orders_insert_tenant" on public.orders
  for insert to authenticated
  with check (user_id = public.effective_owner(auth.uid()));
create policy "orders_update_tenant" on public.orders
  for update to authenticated
  using (user_id = public.effective_owner(auth.uid()))
  with check (user_id = public.effective_owner(auth.uid()));
create policy "orders_delete_tenant" on public.orders
  for delete to authenticated
  using (user_id = public.effective_owner(auth.uid()));

-- ORDER_ITEMS
alter table public.order_items enable row level security;
drop policy if exists "order_items_select_own"    on public.order_items;
drop policy if exists "order_items_insert_own"    on public.order_items;
drop policy if exists "order_items_update_own"    on public.order_items;
drop policy if exists "order_items_delete_own"    on public.order_items;
drop policy if exists "order_items_select_tenant" on public.order_items;
drop policy if exists "order_items_insert_tenant" on public.order_items;
drop policy if exists "order_items_update_tenant" on public.order_items;
drop policy if exists "order_items_delete_tenant" on public.order_items;

create policy "order_items_select_tenant" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_items.order_id
                   and o.user_id = public.effective_owner(auth.uid())));
create policy "order_items_insert_tenant" on public.order_items
  for insert to authenticated
  with check (exists (select 1 from public.orders o
                      where o.id = order_items.order_id
                        and o.user_id = public.effective_owner(auth.uid())));
create policy "order_items_update_tenant" on public.order_items
  for update to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_items.order_id
                   and o.user_id = public.effective_owner(auth.uid())));
create policy "order_items_delete_tenant" on public.order_items
  for delete to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_items.order_id
                   and o.user_id = public.effective_owner(auth.uid())));

-- PRODUCTS
alter table public.products enable row level security;
drop policy if exists "products_select_own"    on public.products;
drop policy if exists "products_insert_own"    on public.products;
drop policy if exists "products_update_own"    on public.products;
drop policy if exists "products_delete_own"    on public.products;
drop policy if exists "products_select_tenant" on public.products;
drop policy if exists "products_insert_tenant" on public.products;
drop policy if exists "products_update_tenant" on public.products;
drop policy if exists "products_delete_tenant" on public.products;

create policy "products_select_tenant" on public.products
  for select to authenticated
  using (user_id = public.effective_owner(auth.uid()));
create policy "products_insert_tenant" on public.products
  for insert to authenticated
  with check (user_id = public.effective_owner(auth.uid()));
create policy "products_update_tenant" on public.products
  for update to authenticated
  using (user_id = public.effective_owner(auth.uid()))
  with check (user_id = public.effective_owner(auth.uid()));
create policy "products_delete_tenant" on public.products
  for delete to authenticated
  using (user_id = public.effective_owner(auth.uid()));

-- SALES (read + insert)
alter table public.sales enable row level security;
drop policy if exists "sales_select_own"    on public.sales;
drop policy if exists "sales_insert_own"    on public.sales;
drop policy if exists "sales_select_tenant" on public.sales;
drop policy if exists "sales_insert_tenant" on public.sales;

create policy "sales_select_tenant" on public.sales
  for select to authenticated
  using (user_id = public.effective_owner(auth.uid()));
create policy "sales_insert_tenant" on public.sales
  for insert to authenticated
  with check (user_id = public.effective_owner(auth.uid()));

-- =====================================================================
-- 4) Vincular o garçom-demo ao dono.
--    Substitua <ID_DO_DONO_ADMIN> pelo id do seu usuário admin
--    (auth.users.id) e descomente para rodar.
-- =====================================================================
-- update public.profiles
--    set role = 'garcom',
--        owner_id = '<ID_DO_DONO_ADMIN>'
--  where email = 'garcom.demo@fluxocomanda.app';
