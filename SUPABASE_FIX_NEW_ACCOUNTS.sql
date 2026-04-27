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
