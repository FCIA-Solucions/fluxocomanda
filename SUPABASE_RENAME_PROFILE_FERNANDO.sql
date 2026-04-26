-- Renomeia o perfil "ZÉLIA CABRAL DA FONSECA" para "Fernando"
-- Rode no SQL Editor do Supabase

UPDATE public.profiles
SET name = 'Fernando'
WHERE name ILIKE 'ZÉLIA CABRAL DA FONSECA'
   OR name ILIKE '%zelia%'
   OR name ILIKE '%zélia%';

-- Conferir
SELECT id, email, name FROM public.profiles WHERE name = 'Fernando';
