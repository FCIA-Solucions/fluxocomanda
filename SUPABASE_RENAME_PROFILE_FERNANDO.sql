-- Renomeia o perfil do usuário logado para "Fernando"
-- Rode no SQL Editor do Supabase

-- 1) PRIMEIRO: veja os profiles atuais e descubra qual é o seu
SELECT id, email, name, business_name
FROM public.profiles
ORDER BY created_at;

-- 2) DEPOIS: descomente UMA das opções abaixo e rode

-- OPÇÃO A — pelo email (mais seguro). Troque pelo seu email:
-- UPDATE public.profiles SET name = 'Fernando'
-- WHERE email ILIKE 'seu-email@exemplo.com';

-- OPÇÃO B — pelo nome atual / negócio (ajuste se precisar):
UPDATE public.profiles
SET name = 'Fernando'
WHERE name ILIKE '%zelia%'
   OR name ILIKE '%zélia%'
   OR business_name ILIKE '%fluxo%';

-- 3) Conferir
SELECT id, email, name, business_name
FROM public.profiles
WHERE name = 'Fernando';
