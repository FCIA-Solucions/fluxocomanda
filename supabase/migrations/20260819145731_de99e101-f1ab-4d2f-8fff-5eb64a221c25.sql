-- Políticas de Storage (agora que o bucket 'logos' deve estar criado como privado)
-- SELECT: leitura pública (apesar de privado, simulamos acesso público via policy se desejado, ou mantemos privado)
-- Como o app espera leitura pública:
CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'logos');

-- INSERT: apenas usuário autenticado, dentro da própria pasta
CREATE POLICY "logos_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: apenas usuário autenticado, dentro da própria pasta
CREATE POLICY "logos_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text
) WITH CHECK (
  bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: apenas usuário autenticado, dentro da própria pasta
CREATE POLICY "logos_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text
);
