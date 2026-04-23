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
