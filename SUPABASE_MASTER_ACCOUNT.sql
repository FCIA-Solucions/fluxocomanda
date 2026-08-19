-- SCRIPT DE CONFIGURAÇÃO DA CONTA MASTER FLUXOCOMANDA
-- Este script configura o acesso vitalício e permissões de superadmin para a conta master.

DO $$
DECLARE
    target_email TEXT := 'blindadoemotivado@gmail.com';
    user_id UUID;
BEGIN
    -- 1. Tenta obter o ID do usuário (deve ser criado via Auth no frontend primeiro)
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;

    IF user_id IS NULL THEN
        RAISE NOTICE 'Usuário % não encontrado. Por favor, cadastre-se no app primeiro.', target_email;
    ELSE
        -- 2. Garante que o perfil existe e aplica as regras de Superadmin e Vitalício
        INSERT INTO public.profiles (
            id, 
            email, 
            role, 
            subscription_status, 
            subscription_expires_at, 
            trial_ends_at
        )
        VALUES (
            user_id, 
            target_email, 
            'superadmin', 
            'active', -- Status ativo para bypass de bloqueio
            NULL,     -- Sem expiração (Vitalício)
            now() + interval '100 years' -- Trial estendido como redundância
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'superadmin',
            subscription_status = 'active',
            subscription_expires_at = NULL,
            trial_ends_at = now() + interval '100 years';

        RAISE NOTICE 'Conta master % configurada com sucesso como Superadmin Vitalício.', target_email;
    END IF;
END $$;
