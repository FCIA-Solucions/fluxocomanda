

# Login com Google no `/auth`

Adicionar OAuth Google mantendo email/senha intacto.

## 1. `src/hooks/useAuth.tsx`

Adicionar `signInWithGoogle` ao contexto:

```ts
signInWithGoogle: async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
  return { error };
}
```

Expor na interface `AuthContextValue` e no `<AuthContext.Provider value={...}>`.

## 2. `src/pages/Auth.tsx`

**Abaixo** do bloco `<Tabs>` (depois dos formulários de email/senha), adicionar:

- **Divisor**: linha horizontal com texto "ou" centralizado (`border-t` + span absoluto com `bg-card px-2`).
- **Botão Google**: `variant="outline"`, `w-full`, `style={{ height: 56 }}`, ícone Google SVG inline (4 cores oficiais) à esquerda, texto "Continuar com Google".
- Handler `handleGoogle`: chama `signInWithGoogle()`, mostra toast de erro se falhar. Sucesso = redirect automático do Supabase pro Google → volta em `/dashboard` → `onAuthStateChange` captura sessão.
- Estado `googleLoading` separado pra mostrar `Loader2` no botão sem afetar o `submitting` dos forms.

Layout final do card:
```text
[ Tabs Entrar | Criar conta ]
[ formulário email/senha     ]
─────── ou ───────
[ 🇬 Continuar com Google    ]
```

## 3. SQL — atualizar trigger `handle_new_user`

Você precisa rodar isto no **SQL Editor do Supabase** (vou colar o SQL completo no chat depois de gerar o código). O trigger atual só lê `name`; Google manda `full_name`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    )
  );
  RETURN NEW;
END;
$$;
```

Sem isso, login Google cria profile com nome vazio.

## 4. Configuração externa (você faz fora do código)

**Google Cloud Console** → Credentials → OAuth client (Web):
- Authorized redirect URI: `https://gessdgkkbpsuvykvokqd.supabase.co/auth/v1/callback`
- Copiar Client ID + Secret.

**Supabase Dashboard** → Authentication → Providers → Google:
- Ativar, colar Client ID + Secret.

**Supabase Dashboard** → Authentication → URL Configuration → Redirect URLs:
- `https://id-preview--d701e835-8fe1-487b-a7ab-9fc6488ed4fc.lovable.app/**`
- `http://localhost:8080/**`

Sem isso o Google retorna `redirect_uri_mismatch`.

## Critério de pronto

- Botão "Continuar com Google" visível em `/auth`, 56px, com divisor "ou".
- Clicar → consentimento Google → volta logado em `/dashboard`.
- `profiles` tem nome preenchido (via trigger atualizado).
- Erro no OAuth dispara toast destrutivo.
- Email/senha continua funcionando.

## Entrega

Após gerar o código, colo o **SQL do trigger atualizado** no chat e te lembro dos passos do Google Cloud + Supabase Dashboard.

