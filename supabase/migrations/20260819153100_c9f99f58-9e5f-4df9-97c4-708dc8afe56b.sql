-- Confirmar o e-mail da conta master
UPDATE auth.users 
SET 
    email_confirmed_at = now(),
    raw_app_meta_data = raw_app_meta_data || '{"email_verified": true}',
    raw_user_meta_data = raw_user_meta_data || '{"email_verified": true}'
WHERE lower(email) = 'blindadoemotivado@gmail.com';
