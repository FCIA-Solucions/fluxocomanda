-- ============================================================
-- FluxoComanda — Fix dos 2 bugs críticos
-- Execute este SQL no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/gessdgkkbpsuvykvokqd/sql/new
-- ============================================================

-- ================================================================
-- BUG 1 — Adicionar colunas faltantes em public.profiles
-- (não quebra registros existentes; usa defaults seguros)
-- ================================================================
alter table public.profiles
  add column if not exists business_name text,
  add column if not exists logo_url text,
  add column if not exists brand_color text default '#22c55e';

-- Garantir que registros antigos tenham brand_color preenchido
update public.profiles
   set brand_color = '#22c55e'
 where brand_color is null;

-- Garantir que policies de SELECT/UPDATE existem (idempotente)
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- ================================================================
-- BUG 2 — Criar bucket "logos" + policies
-- ================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  2097152, -- 2MB
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Policies do bucket: arquivos vivem em {user_id}/...
drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read" on storage.objects
  for select to public
  using (bucket_id = 'logos');

drop policy if exists "logos_user_insert" on storage.objects;
create policy "logos_user_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "logos_user_update" on storage.objects;
create policy "logos_user_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "logos_user_delete" on storage.objects;
create policy "logos_user_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
