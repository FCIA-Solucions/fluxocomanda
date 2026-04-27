## Causa raiz

O erro `new row violates row-level security policy for table "products"` e a personalização que "não salva" têm a mesma origem: a **conta nova não tem profile válido** (ou o profile foi criado sem `role`/`owner_id` corretos), então:

- `public.effective_owner(auth.uid())` retorna `NULL`
- O `INSERT` em `products` envia `user_id = user.id` mas a política RLS exige `user_id = effective_owner(auth.uid())` → `NULL ≠ user.id` → bloqueio.
- O `UPDATE profiles WHERE id = user.id` simplesmente **não encontra a linha** e retorna 0 rows afetadas (sem erro) → a UI mostra "salvo ✅" mas nada mudou.

Isso provavelmente foi causado pela migração `SUPABASE_MULTI_ADMIN.sql` que removeu o CHECK constraint de `role` mas o trigger `on_auth_user_created` (que cria o profile no signup) pode ter ficado quebrado, ou o profile dessa conta nova ficou sem `role`.

## Plano

### 1. SQL para diagnóstico e correção (arquivo `SUPABASE_FIX_NEW_ACCOUNTS.sql`)

- Recriar/garantir o trigger `handle_new_user` que insere em `profiles` com `role='admin'`, `owner_id=NULL`, `email` e `trial_ends_at = now()+7d` quando um usuário é criado em `auth.users`.
- Fazer um `INSERT ... ON CONFLICT DO NOTHING` retroativo para criar profiles em todos os `auth.users` que não têm linha em `profiles`.
- Fazer `UPDATE profiles SET role='admin' WHERE role IS NULL OR role NOT IN ('admin','garcom','superadmin')` para corrigir profiles existentes.
- Reafirmar o CHECK constraint em `role` aceitando os 3 valores.
- Mostrar o SQL no chat para o usuário rodar no SQL Editor.

### 2. Código defensivo

- **`src/pages/Produtos.tsx`**: trocar `user_id: user.id` por `user_id: effectiveUserId` nos 2 inserts (linhas 174 e 178), e usar `effectiveUserId` também nos selects (linhas 91 e 98) — assim garçons também enxergam os produtos do dono.
- **`src/pages/Caixa.tsx`**: trocar `user_id: user.id` (linha 147) e os filtros `eq("user_id", user.id)` (linhas 85, 101) por `effectiveUserId`. Manter o `eq("id", user.id)` da linha 142 que busca o profile do próprio usuário.
- **`src/pages/MeuNegocio.tsx`** (`handleSave`): após o `update`, checar se retornou alguma linha (`.select()`) — se 0 linhas, mostrar erro claro "Perfil não encontrado, rode o SQL de correção" em vez de "salvo ✅" enganoso. E mostrar o `error?.message` real.
- **`src/hooks/useProfile.tsx`**: se o `select` em `profiles` retornar `null` (profile não existe), tentar criar via `insert` com `role='admin'` e os defaults — fallback de auto-cura do lado do cliente.

### 3. Validação

Após rodar o SQL e o código atualizado:
- Logar com a conta nova → o `useProfile` deve carregar `role='admin'` e `effectiveUserId = user.id`.
- Personalizar Meu Negócio → toast "Configurações salvas" e os dados persistirem após reload.
- Criar um produto → sem erro de RLS.

### Arquivos afetados

- `SUPABASE_FIX_NEW_ACCOUNTS.sql` (novo)
- `src/pages/Produtos.tsx`
- `src/pages/Caixa.tsx`
- `src/pages/MeuNegocio.tsx`
- `src/hooks/useProfile.tsx`