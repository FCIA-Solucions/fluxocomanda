## Problema

O `.env` do projeto tem `VITE_ADMIN_EMAIL=` (string **vazia**, não ausente). O Vite injeta como `""`, e o operador `??` em `subscriptionConfig.ts` **não** ativa o fallback `"blindadoemotivado@gmail.com"` porque `""` não é `null`/`undefined`. Resultado: `ADMIN_EMAIL = ""`, o bypass falha, o trial venceu em 25/04 e o app te bloqueia em `/assinatura`.

Logs confirmam:
- email do user: `blindadoemotivado@gmail.com` ✅
- `trial_ends_at`: `2026-04-25` (vencido) → `status = expired`
- `isAdmin` calculado como `false` por causa do `ADMIN_EMAIL` vazio

## Correção (1 arquivo, 3 linhas)

**`src/lib/subscriptionConfig.ts`** — trocar `??` por uma checagem que também trate string vazia como ausente, garantindo que o fallback **sempre** valha quando a env não tem valor real:

```ts
const envAdmin = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim();
export const ADMIN_EMAIL = envAdmin && envAdmin.length > 0
  ? envAdmin
  : "blindadoemotivado@gmail.com";
```

Aplicar o mesmo padrão para `PIX_KEY`, `WHATSAPP_NUMBER` e `WHATSAPP_MESSAGE` para evitar a mesma classe de bug (PIX/WhatsApp vazios em produção quando alguém deixar a env em branco).

## Resultado esperado

- Após a alteração + reload, ao logar com `blindadoemotivado@gmail.com`:
  - `isAdmin = true`
  - `isBlocked = false`
  - `ProtectedRoute` libera Dashboard, Comandas, Produtos, Relatórios etc.
  - Você consegue ver as mudanças solicitadas (Venda Guardada, etc.) sem passar por `/assinatura`.

## O que NÃO muda

- Lógica de assinatura, RLS, banco, Auth, ou qualquer outro arquivo.
- Comportamento para outros usuários (continuam sujeitos a trial/expired normalmente).
