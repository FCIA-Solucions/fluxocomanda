## Mudar trial de 3 → 7 dias

Vou alterar todos os pontos onde "3 dias" está fixado no código e gerar o SQL para atualizar o banco.

### 1. Frontend (código)

**`src/hooks/useSubscription.tsx`** (linha 44)
- Trocar fallback `daysLeft: 3` por `daysLeft: 7` (usado quando o usuário ainda não tem nenhum campo de assinatura preenchido).

### 2. SQL — atualizar o banco

Vou atualizar o arquivo **`SUPABASE_MIGRATION_SUBSCRIPTION.sql`** e exibir o SQL no chat para você rodar no SQL Editor do Supabase. O script vai:

1. **Mudar o DEFAULT da coluna** `trial_ends_at` de `now() + interval '3 days'` para `now() + interval '7 days'` — afeta novos cadastros que entrarem direto pelo INSERT sem trigger.
2. **Recriar a função `handle_new_user()`** para inserir `now() + interval '7 days'` ao criar profile via signup — esse é o caminho real usado hoje.
3. **Estender o trial de quem ainda está em trial** (`subscription_status = 'trial'` e `trial_ends_at > now()`): somar +4 dias para que ninguém em trial ativo perca tempo com a mudança.
   - Não vou mexer em quem já expirou nem em quem está `active`/`vitalicio`.

```sql
-- 1) Novo default: 7 dias
ALTER TABLE public.profiles
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '7 days');

-- 2) Trigger de novo usuário: 7 dias
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, trial_ends_at, subscription_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.email,
    now() + interval '7 days',
    'trial'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3) Estender +4 dias para quem ainda está em trial ativo
UPDATE public.profiles
   SET trial_ends_at = trial_ends_at + interval '4 days'
 WHERE subscription_status = 'trial'
   AND trial_ends_at IS NOT NULL
   AND trial_ends_at > now();
```

### Pontos que NÃO precisam mudar
- `SubscriptionBanner.tsx`: o aviso `daysLeft <= 1` para trial continua adequado (avisa 1 dia antes de expirar) — não está atrelado a "3 dias".
- `Admin.tsx`: já usa data dinâmica via input — sem número fixo.
- `database.types.ts`: tipos não mudam.

### Resumo dos arquivos
- **Editar**: `src/hooks/useSubscription.tsx`
- **Editar**: `SUPABASE_MIGRATION_SUBSCRIPTION.sql` (mantém histórico atualizado)
- **SQL pra você rodar**: vou colar no chat após implementar
