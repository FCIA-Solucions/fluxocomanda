

# FluxoComanda — Fase 1 (execução)

Supabase externo via hardcode. URL + publishable key prontos.

## Credenciais que vou hardcodar

```text
URL:  https://gessdgkkbpsuvykvokqd.supabase.co
KEY:  sb_publishable_6FXZBzUPaO6FZivS5wP7VQ_afGgybN4
```

Ambas públicas — seguro no bundle. RLS protege os dados.

## 1. Cliente Supabase

`src/integrations/supabase/client.ts` — cliente com `persistSession: true`, `autoRefreshToken: true`, `storage: localStorage`. Sem `.env`, valores literais.

`src/integrations/supabase/types.ts` — tipos TS manuais das 5 tabelas (Database interface) pra autocomplete e segurança.

## 2. SQL que VOCÊ roda no Supabase (eu entrego pronto)

Vou te dar **um único bloco SQL** pra colar em **SQL Editor → New query → Run**. Conteúdo:

- 5 tabelas: `profiles`, `products`, `orders`, `order_items`, `sales` (tipos exatos do brief)
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` em todas
- Policies SELECT/INSERT/UPDATE/DELETE por tabela:
  - `profiles`: `id = auth.uid()`
  - `products` / `orders` / `sales`: `user_id = auth.uid()`
  - `order_items`: validado via `EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())`
- Função `public.handle_new_user()` SECURITY DEFINER, `search_path = public`, que insere em `profiles` usando `NEW.raw_user_meta_data->>'name'` e `NEW.email`
- Trigger `on_auth_user_created` AFTER INSERT em `auth.users`
- Índices: `orders(user_id, status)`, `order_items(order_id)`, `sales(user_id, created_at DESC)`, `products(user_id, active)`

## 3. Configuração no Dashboard Supabase (você faz)

- **Authentication → URL Configuration**
  - Site URL: `https://id-preview--d701e835-8fe1-487b-a7ab-9fc6488ed4fc.lovable.app`
  - Redirect URLs: a mesma URL + `http://localhost:8080`
- **Authentication → Providers → Email**: desligar **Confirm email** (dev). Religar antes de produção.

## 4. Design system (dark fixo)

`src/index.css` tokens HSL:

```text
--background: 222 47% 11%      (#0f172a)
--card:       217 33% 17%      (#1e293b)
--primary:    142 71% 45%      (#22c55e)
--primary-foreground: 210 40% 98%
--destructive: 0 84% 60%       (#ef4444)
--foreground: 210 40% 98%      (#f8fafc)
--muted-foreground: 215 16% 65% (#94a3b8)
--border: 217 33% 22%
--radius: 1rem
```

`tailwind.config.ts`: `minHeight.touch = 56px`, fonte Inter. `<html class="dark" lang="pt-BR">` em `index.html` + Google Fonts Inter + theme-color #0f172a + title FluxoComanda.

## 5. Auth + navegação

```text
NOVOS
  src/integrations/supabase/client.ts
  src/integrations/supabase/types.ts
  src/hooks/useAuth.tsx          (provider, onAuthStateChange ANTES de getSession)
  src/components/ProtectedRoute.tsx
  src/components/BottomNav.tsx   (4 tabs: Home/Comandas/Produtos/Caixa, h-16 fixed)
  src/components/AppShell.tsx    (wrapper pb-20 + padding lateral)
  src/pages/Auth.tsx             (tabs Entrar/Criar conta, Zod, inputs h-13, botão h-14)
  src/pages/Dashboard.tsx        ("Olá, {name}" + botão Sair)
  src/pages/Comandas.tsx         (placeholder)
  src/pages/Produtos.tsx         (placeholder)
  src/pages/Caixa.tsx            (placeholder)

ALTERADOS
  src/App.tsx       (AuthProvider + rotas + ProtectedRoute envolvendo as protegidas)
  src/pages/Index.tsx  (Navigate to /dashboard)
  src/index.css     (tokens)
  tailwind.config.ts
  index.html
```

Rotas:

```text
/auth      público
/          → /dashboard
/dashboard /comandas /produtos /caixa  → protegidas
*          NotFound
```

Signup envia `options.data = { name }` + `emailRedirectTo: ${window.location.origin}/`. Validação Zod (email, senha ≥6, nome ≥2). Toasts em sucesso/erro.

## Critério de pronto

- Você roda o SQL → tabelas + trigger + RLS criadas.
- Cadastro pelo app cria linha em `auth.users` E em `profiles` (via trigger).
- Login persiste após reload.
- Sem sessão, qualquer rota protegida cai em `/auth`.
- Bottom nav fixo, todos os botões ≥56px de altura.

## Entrega

Após gerar o código, vou colar o **SQL completo** no chat pra você rodar — sem isso, signup falha no trigger.

Próxima fase (não nesta): CRUD de produtos + abertura/edição de comanda.

