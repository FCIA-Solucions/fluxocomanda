-- Renomeia o perfil do Fernando (user_id confirmado pelos logs)
-- Rode no SQL Editor do Supabase

UPDATE public.profiles
SET name = 'Fernando'
WHERE id = '54a77227-7615-4388-9c63-36e96a67ccac';

-- Conferir
SELECT id, email, name, business_name
FROM public.profiles
WHERE id = '54a77227-7615-4388-9c63-36e96a67ccac';
