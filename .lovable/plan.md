

# FluxoComanda — Fase 1: Base, Auth e Banco

Supabase já conectado. Vou montar agora o schema, a auth e o esqueleto do app.

## 1. Banco de Dados (1 migration)

5 tabelas exatamente como no brief — `profiles`, `products`, `orders`, `order_items`, `sales` — com tipos, defaults e FKs especificados.

**RLS ativa em todas as 5** (decidi pelo padrão seguro: deixar `profiles`, `order_items` ou `sales` abertos vazaria dados entre usuários). Policies separadas para SELECT / INSERT / UPDATE / DELETE:

- `profiles`: `id = auth.uid()`
- `products`, `orders`, `sales`: `user_id = auth.uid()`
- `order_items`: validado via `EXISTS` no `orders` pai

**Trigger `handle_new_user`** (SECURITY DEFINER, search_path=public): após signup em `auth.users`, cria a linha em `profiles` com `name` vindo de `raw_user_meta_data->>'name'` e `email` do próprio auth.

**Índices**: `orders(user_id, status)`, `order_items(order_id)`, `sales(user_id, created_at)`, `products(user_id, active)`.

## 2. Design System (modo dark fixo)

`src/index.css` com tokens HSL do brief:

```text
--background: 222 47% 11%   (#0f172a)
--card:       217 33% 17%   (#1e293b)
--primary:    142 71% 45%   (#22c55e)
--destructive: 0 84% 60%    (#ef4444)
--foreground: 210 40% 98%   (#f8fafc)
--muted-foreground: 215 20% 65% (#94a3b8)
--radius: 1rem (cards 16px), btn 0.75rem (12px)
```

`tailwind.config.ts`: `min-h-touch: 56px`, fonte Inter via `<link>` no `index.html`, base 16px. `<html class="dark">` fixo.

## 3. Autenticação

- **`src/hooks/useAuth.tsx`** — provider com `onAuthStateChange` registrado ANTES de `getSession()` (evita race), expõe `user`, `session`, `loading`, `signIn`, `signUp`, `signOut`.
- **`src/pages/Auth.tsx`** (rota `/auth`) — tabs "Entrar" / "Criar conta" no mesmo card #1e293b sobre fundo #0f172a. Inputs h-13 (52px), botão verde h-14 (56px) full width. Validação Zod (email válido, senha ≥6, nome ≥2 no signup). Toast em sucesso/erro. `signUp` envia `options.data.name` + `emailRedirectTo: ${window.location.origin}/`. Sessão persiste no localStorage (padrão do client gerado).
- **`src/components/ProtectedRoute.tsx`** — redireciona pra `/auth` sem sessão, mostra loader enquanto `loading`.

## 4. Layout & Navegação

- **`src/components/BottomNav.tsx`** — 4 ícones lucide (`Home`, `ClipboardList`, `Package`, `Wallet`), fixed bottom, h-16, fundo card, ativo em verde.
- **`src/components/AppShell.tsx`** — wrapper com `pb-20` (espaço pro nav) e padding lateral 16px.
- Rotas em `App.tsx`:
  ```text
  /auth         → Auth (público)
  /             → redirect para /dashboard
  /dashboard    → Dashboard ("Olá, {name}" + sair)
  /comandas     → placeholder
  /produtos     → placeholder
  /caixa        → placeholder
  *             → NotFound
  ```

## 5. Arquivos

```text
NOVOS
  src/hooks/useAuth.tsx
  src/components/ProtectedRoute.tsx
  src/components/BottomNav.tsx
  src/components/AppShell.tsx
  src/pages/Auth.tsx
  src/pages/Dashboard.tsx
  src/pages/Comandas.tsx       (placeholder)
  src/pages/Produtos.tsx       (placeholder)
  src/pages/Caixa.tsx          (placeholder)
  + migration SQL (tabelas, RLS, trigger, índices)

ALTERADOS
  src/index.css           (tokens FluxoComanda)
  tailwind.config.ts      (min-h-touch, raios)
  src/App.tsx             (AuthProvider + rotas + ProtectedRoute)
  src/pages/Index.tsx     (redirect → /dashboard)
  index.html              (Inter, theme-color #0f172a, lang pt-BR, title FluxoComanda, classe dark)
```

## Critério de pronto

- Cadastro cria `auth.users` + `profiles` automaticamente via trigger.
- Login persiste após reload.
- Sem sessão, qualquer rota protegida cai em `/auth`.
- RLS impede ler dados de outro usuário (testável no SQL Editor do Supabase).
- Bottom nav fixo, área de toque ≥56px em todos os botões.

Próxima fase (não nesta entrega): CRUD de produtos + abertura/edição de comanda.

