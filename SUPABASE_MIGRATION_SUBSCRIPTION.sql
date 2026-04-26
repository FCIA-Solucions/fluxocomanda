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
