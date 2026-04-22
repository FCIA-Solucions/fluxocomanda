-- ============================================================
-- FluxoComanda — Migração: Sistema de Assinatura
-- Execute este SQL no SQL Editor:
-- https://supabase.com/dashboard/project/gessdgkkbpsuvykvokqd/sql/new
-- ============================================================

alter table public.profiles
  add column if not exists subscription_status text not null default 'trial'
    check (subscription_status in ('trial','active','expired'));

alter table public.profiles
  add column if not exists subscription_expires_at timestamptz;

alter table public.profiles
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '3 days');

-- Garantir que usuários antigos (que tinham trial_ends_at NULL antes) ganhem 3 dias de trial
update public.profiles
  set trial_ends_at = now() + interval '3 days'
  where trial_ends_at is null;

-- Atualizar trigger de criação de profile para definir trial_ends_at
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
    now() + interval '3 days',
    'trial'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
