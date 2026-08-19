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
-- =====================================================================
-- RPC ATÔMICA: fechar_comanda
-- Substitui o fechamento simples de comanda por uma transação única.
-- Em caso de qualquer erro, todo o fechamento é revertido (rollback).
--
-- COMO RODAR:
-- 1. Abra o Supabase SQL Editor:
--    https://supabase.com/dashboard/project/gessdgkkbpsuvykvokqd/sql/new
-- 2. Cole TODO o conteúdo abaixo e clique em "Run"
-- =====================================================================

CREATE OR REPLACE FUNCTION public.fechar_comanda(
  p_order_id uuid,
  p_payment_method text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_order   public.orders%ROWTYPE;
  v_total   numeric;
  v_now     timestamptz := now();
BEGIN
  -- 1) Autenticação
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado' USING ERRCODE = '28000';
  END IF;

  -- 2) Validar forma de pagamento
  IF p_payment_method NOT IN ('dinheiro', 'pix', 'cartao') THEN
    RAISE EXCEPTION 'Forma de pagamento inválida' USING ERRCODE = '22023';
  END IF;

  -- 3) Buscar comanda com lock para evitar fechamento concorrente
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comanda não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status = 'closed' THEN
    RAISE EXCEPTION 'Comanda já está fechada' USING ERRCODE = 'P0001';
  END IF;

  -- 4) Calcular total atual a partir dos itens (fonte da verdade)
  SELECT COALESCE(SUM(subtotal), 0)
    INTO v_total
  FROM public.order_items
  WHERE order_id = p_order_id;

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'Comanda sem itens' USING ERRCODE = 'P0001';
  END IF;

  -- 5) Registrar a venda (sales)
  INSERT INTO public.sales (user_id, order_id, total, payment_method)
  VALUES (v_user_id, p_order_id, v_total, p_payment_method);

  -- 6) Atualizar a comanda
  UPDATE public.orders
     SET status         = 'closed',
         closed_at      = v_now,
         payment_method = p_payment_method,
         total          = v_total
   WHERE id = p_order_id;

  -- 7) Retorno
  RETURN jsonb_build_object(
    'success',        true,
    'order_id',       p_order_id,
    'total',          v_total,
    'payment_method', p_payment_method,
    'closed_at',      v_now
  );

EXCEPTION
  WHEN OTHERS THEN
    -- PostgreSQL faz rollback automático da transação da função.
    RAISE;
END;
$$;

-- Permissões
REVOKE ALL ON FUNCTION public.fechar_comanda(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fechar_comanda(uuid, text) TO authenticated;
-- ============================================================
-- FluxoComanda — Migração: Sistema de Assinatura
-- Trial de 7 dias
-- Execute este SQL no SQL Editor:
-- https://supabase.com/dashboard/project/gessdgkkbpsuvykvokqd/sql/new
-- ============================================================

alter table public.profiles
  add column if not exists subscription_status text not null default 'trial'
    check (subscription_status in ('trial','active','expired'));

alter table public.profiles
  add column if not exists subscription_expires_at timestamptz;

alter table public.profiles
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '7 days');

-- Atualizar o DEFAULT (caso a coluna já existisse com 3 dias)
alter table public.profiles
  alter column trial_ends_at set default (now() + interval '7 days');

-- Garantir que usuários antigos (que tinham trial_ends_at NULL) ganhem 7 dias de trial
update public.profiles
  set trial_ends_at = now() + interval '7 days'
  where trial_ends_at is null;

-- Estender +4 dias para quem ainda está em trial ativo (migração de 3→7)
update public.profiles
   set trial_ends_at = trial_ends_at + interval '4 days'
 where subscription_status = 'trial'
   and trial_ends_at is not null
   and trial_ends_at > now();

-- Atualizar trigger de criação de profile para definir trial_ends_at = 7 dias
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, trial_ends_at, subscription_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.email,
    now() + interval '7 days',
    'trial'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
-- =====================================================================
-- FluxoComanda — Clientes integrados às comandas
-- Rode este SQL no Supabase → SQL Editor
-- =====================================================================

-- 1) Garantir colunas/índices úteis na tabela customers (já existente)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS apelido  text;

CREATE INDEX IF NOT EXISTS idx_customers_user_id   ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_nome      ON public.customers (lower(nome));
CREATE INDEX IF NOT EXISTS idx_customers_apelido   ON public.customers (lower(apelido));
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp  ON public.customers (whatsapp);

-- 2) Vincular comanda a cliente (opcional — pode ser NULL)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
-- =====================================================================
-- FluxoComanda — Tabela de Fechamentos de Caixa (cash_closures)
-- Rode este script no SQL Editor do Supabase (uma única vez)
-- =====================================================================

create table if not exists public.cash_closures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  closed_at timestamptz not null default now(),
  business_day date not null,
  type text not null check (type in ('manual', 'auto')),
  closed_by_name text,
  total numeric(12,2) not null default 0,
  total_dinheiro numeric(12,2) not null default 0,
  total_pix numeric(12,2) not null default 0,
  total_cartao numeric(12,2) not null default 0,
  sales_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Garantir 1 fechamento por usuário/dia
create unique index if not exists cash_closures_user_day_uniq
  on public.cash_closures (user_id, business_day);

create index if not exists cash_closures_user_closed_at_idx
  on public.cash_closures (user_id, closed_at desc);

-- RLS
alter table public.cash_closures enable row level security;

drop policy if exists "select own closures" on public.cash_closures;
create policy "select own closures"
  on public.cash_closures
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own closures" on public.cash_closures;
create policy "insert own closures"
  on public.cash_closures
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "delete own closures" on public.cash_closures;
create policy "delete own closures"
  on public.cash_closures
  for delete
  to authenticated
  using (auth.uid() = user_id);
-- Adiciona a coluna 'categoria' na tabela products (se ainda não existir)
-- Valores aceitos pelo app: 'bebidas', 'comidas', 'outros'

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'outros';

-- (Opcional) Restringe os valores possíveis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_categoria_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_categoria_check
      CHECK (categoria IN ('bebidas', 'comidas', 'outros'));
  END IF;
END $$;

-- Índice para filtros por categoria
CREATE INDEX IF NOT EXISTS idx_products_categoria ON public.products(categoria);
-- ============================================================
-- FluxoComanda — Múltiplos Admins (superadmins)
-- Execute no Supabase → SQL Editor
-- https://supabase.com/dashboard/project/gessdgkkbpsuvykvokqd/sql/new
-- ============================================================

-- 1) Garante que a coluna 'role' aceita 'superadmin'
--    (caso já exista um CHECK constraint restringindo valores)
DO $$
BEGIN
  -- remove constraints antigas, se houverem, com nomes comuns
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END$$;

-- (não recriamos CHECK — deixamos a coluna como text livre,
--  os valores válidos são 'admin' | 'garcom' | 'superadmin')

-- 2) Atualiza is_fcia_admin(): true se o usuário logado é superadmin
--    OU se é o e-mail mestre (fallback de emergência)
CREATE OR REPLACE FUNCTION public.is_fcia_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = auth.uid()
      AND (
        p.role = 'superadmin'
        OR lower(u.email) = 'blindadoemotivado@gmail.com'
      )
  );
$$;

-- 3) Garante as policies do painel admin (idempotente)
DROP POLICY IF EXISTS "FCIA admin can view all profiles" ON public.profiles;
CREATE POLICY "FCIA admin can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_fcia_admin());

DROP POLICY IF EXISTS "FCIA admin can update all profiles" ON public.profiles;
CREATE POLICY "FCIA admin can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_fcia_admin())
  WITH CHECK (public.is_fcia_admin());

-- 4) Garante que SEU usuário é superadmin (ajusta também o e-mail mestre)
UPDATE public.profiles
   SET role = 'superadmin'
 WHERE id IN (
   SELECT id FROM auth.users
   WHERE lower(email) = 'blindadoemotivado@gmail.com'
 );
-- =====================================================================
-- FIX: Tabela profiles incompleta + Bucket logos ausente
--
-- COMO RODAR:
-- 1. Abra: https://supabase.com/dashboard/project/gessdgkkbpsuvykvokqd/sql/new
-- 2. Cole TODO o conteúdo abaixo e clique em "Run".
--
-- Observação: a tabela do projeto chama-se "profiles" (minúsculo),
-- não "Perfis". Os scripts abaixo são idempotentes — podem ser
-- executados mais de uma vez sem causar erro.
-- =====================================================================


-- =====================================================================
-- BUG 1 — Adicionar colunas faltantes em public.profiles
-- =====================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS logo_url      TEXT,
  ADD COLUMN IF NOT EXISTS brand_color   TEXT DEFAULT '#22c55e';

-- Backfill: registros antigos ficam com a cor padrão
UPDATE public.profiles
   SET brand_color = '#22c55e'
 WHERE brand_color IS NULL;


-- =====================================================================
-- BUG 2 — Bucket "logos" no Storage
-- =====================================================================

-- Cria (ou atualiza) o bucket "logos":
--   public = true
--   max file size = 2 MB
--   MIME types permitidos: png, jpeg, webp
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ---------------------------------------------------------------------
-- Policies do bucket "logos"
--
-- Convenção de path usada pelo app: <auth.uid()>/logo-<timestamp>.<ext>
-- A primeira pasta do path é o id do usuário, e é nela que travamos
-- as permissões de escrita.
-- ---------------------------------------------------------------------

-- Limpa policies antigas (se existirem) para não duplicar
DROP POLICY IF EXISTS "logos_public_read"          ON storage.objects;
DROP POLICY IF EXISTS "logos_owner_insert"         ON storage.objects;
DROP POLICY IF EXISTS "logos_owner_update"         ON storage.objects;
DROP POLICY IF EXISTS "logos_owner_delete"         ON storage.objects;

-- SELECT: qualquer um pode visualizar (bucket público)
CREATE POLICY "logos_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- INSERT: apenas usuário autenticado, dentro da própria pasta
CREATE POLICY "logos_owner_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE: idem
CREATE POLICY "logos_owner_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: idem
CREATE POLICY "logos_owner_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- =====================================================================
-- FluxoComanda: corrige contas novas que não criam profile/role corretos
--
-- Sintomas que isso resolve:
--  - "new row violates row-level security policy for table products"
--  - Personalização (Meu Negócio) parece salvar mas não persiste
--  - Conta nova não aparece no painel admin
--
-- COMO RODAR:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Cole este arquivo inteiro e execute
-- =====================================================================

-- 1) Garantir CHECK constraint da role aceitando os 3 valores ----------
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
  alter table public.profiles
    add constraint profiles_role_check
    check (role in ('admin', 'garcom', 'superadmin'));
end $$;

-- 2) Trigger que cria o profile quando um usuário é criado em auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, owner_id, trial_ends_at)
  values (
    new.id,
    new.email,
    'admin',
    null,
    now() + interval '7 days'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Backfill: criar profile para qualquer auth.users que não tenha ----
insert into public.profiles (id, email, role, owner_id, trial_ends_at)
select
  u.id,
  u.email,
  'admin',
  null,
  coalesce(u.created_at, now()) + interval '7 days'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 4) Corrigir profiles existentes com role inválido --------------------
update public.profiles
   set role = 'admin'
 where role is null
    or role not in ('admin', 'garcom', 'superadmin');

-- 5) Diagnóstico: liste profiles com problemas (deve voltar 0 linhas) --
select
  u.id,
  u.email,
  p.role,
  p.owner_id,
  case
    when p.id is null then 'SEM PROFILE'
    when p.role is null then 'ROLE NULL'
    else 'OK'
  end as status
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null or p.role is null;
-- ============================================================
-- Painel Admin FCIA — Acesso a todos os perfis
-- Roda no Supabase → SQL Editor
-- ============================================================

-- 1) Função helper: verifica se o usuário logado é o admin do FCIA
CREATE OR REPLACE FUNCTION public.is_fcia_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) = 'blindadoemotivado@gmail.com'
  );
$$;

-- 2) Política de SELECT: admin pode ver TODOS os perfis
DROP POLICY IF EXISTS "FCIA admin can view all profiles" ON public.profiles;
CREATE POLICY "FCIA admin can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_fcia_admin());

-- 3) Política de UPDATE: admin pode editar QUALQUER perfil
DROP POLICY IF EXISTS "FCIA admin can update all profiles" ON public.profiles;
CREATE POLICY "FCIA admin can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_fcia_admin())
  WITH CHECK (public.is_fcia_admin());
