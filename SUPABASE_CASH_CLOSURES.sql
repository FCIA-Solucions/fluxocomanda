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
