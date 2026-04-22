-- ============================================================
-- FluxoComanda — Schema completo (Fase 1 + 2 + 3 + Meu Negócio)
-- Execute este SQL no SQL Editor do seu projeto Supabase externo:
-- https://supabase.com/dashboard/project/gessdgkkbpsuvykvokqd/sql/new
-- ============================================================

-- 1) PROFILES -------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  business_name text,
  logo_url text,
  brand_color text not null default '#22c55e',
  created_at timestamptz not null default now()
);

-- Garantir colunas novas em bases já existentes
alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists logo_url text;
alter table public.profiles add column if not exists brand_color text not null default '#22c55e';

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Trigger: cria profile automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) PRODUCTS -------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  cost numeric(10,2) check (cost is null or cost >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products(user_id);

alter table public.products enable row level security;

drop policy if exists "products_select_own" on public.products;
create policy "products_select_own" on public.products
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own" on public.products
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own" on public.products
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own" on public.products
  for delete to authenticated using (auth.uid() = user_id);

-- 3) ORDERS (comandas) ---------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text,
  status text not null default 'open' check (status in ('open','closed')),
  total numeric(10,2) not null default 0 check (total >= 0),
  payment_method text check (payment_method in ('dinheiro','pix','cartao')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(user_id, status);
create index if not exists orders_closed_at_idx on public.orders(user_id, closed_at);

alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own" on public.orders
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "orders_delete_own" on public.orders;
create policy "orders_delete_own" on public.orders
  for delete to authenticated using (auth.uid() = user_id);

-- 4) ORDER_ITEMS ---------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0)
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert to authenticated with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "order_items_update_own" on public.order_items;
create policy "order_items_update_own" on public.order_items
  for update to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "order_items_delete_own" on public.order_items;
create policy "order_items_delete_own" on public.order_items
  for delete to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- 5) SALES ---------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  total numeric(10,2) not null check (total >= 0),
  payment_method text check (payment_method in ('dinheiro','pix','cartao')),
  created_at timestamptz not null default now()
);

create index if not exists sales_user_id_idx on public.sales(user_id);
create index if not exists sales_created_at_idx on public.sales(user_id, created_at);

alter table public.sales enable row level security;

drop policy if exists "sales_select_own" on public.sales;
create policy "sales_select_own" on public.sales
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "sales_insert_own" on public.sales;
create policy "sales_insert_own" on public.sales
  for insert to authenticated with check (auth.uid() = user_id);

-- 6) Profile para usuário JÁ existente
insert into public.profiles (id, name, email)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name'),
  u.email
from auth.users u
on conflict (id) do nothing;

-- 7) STORAGE BUCKET para logos do estabelecimento ------------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Policies do bucket: cada usuário gerencia somente seus próprios arquivos
-- (caminho deve começar com {user_id}/...)
drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read" on storage.objects
  for select to public using (bucket_id = 'logos');

drop policy if exists "logos_user_insert" on storage.objects;
create policy "logos_user_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "logos_user_update" on storage.objects;
create policy "logos_user_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "logos_user_delete" on storage.objects;
create policy "logos_user_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);
