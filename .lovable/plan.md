## Objetivo

Hoje só `blindadoemotivado@gmail.com` é tratado como admin pelo sistema. Vamos permitir que **vários e-mails** sejam superadmins (acesso liberado, sem cobrança e com acesso ao painel /admin), e que você possa **promover/rebaixar** outros usuários direto pela tela, sem mexer em SQL.

## Como funciona hoje (resumo)

- `useSubscription.tsx` libera bypass se `email == VITE_ADMIN_EMAIL` **ou** se `profiles.role == 'superadmin'`.
- `Admin.tsx` (rota `/admin`) só deixa entrar quem tem `email == VITE_ADMIN_EMAIL`. Por isso, mesmo promovendo alguém a superadmin no banco, ele não consegue abrir o painel admin.
- `ProtectedRoute` com `adminOnly` aceita `role in ('admin','superadmin')`.

## Mudanças propostas

### 1. `src/pages/Admin.tsx` — liberar entrada por role
- Trocar a checagem `isAuthorized = email == ADMIN_EMAIL` por: **autorizado se** `email == ADMIN_EMAIL` **OU** `profiles.role == 'superadmin'`.
- Buscar o `role` do próprio usuário antes de renderizar (curtinho, em paralelo ao load).
- Adicionar nova coluna `role` no tipo `ProfileRow` (já existe no banco).

### 2. `src/pages/Admin.tsx` — botão "Tornar admin" / "Remover admin"
Em cada card de cliente, ao lado de "Definir plano" e "Desativar", incluir:
- Se `role != 'superadmin'`: botão **"Tornar admin"** (ícone Shield) → faz `update profiles set role='superadmin' where id=...`.
- Se `role == 'superadmin'`: badge roxo "Superadmin" + botão **"Remover admin"** → volta para `role='admin'` (dono normal).
- Proteção: não deixar remover o admin do próprio e-mail mestre (`ADMIN_EMAIL`) nem rebaixar a si mesmo (evita travar o painel).
- Toast de sucesso/erro e refresh do estado local.

### 3. `src/pages/MeuNegocio.tsx` — mostrar status de acesso
Adicionar um pequeno bloco no topo da página mostrando:
- E-mail logado
- Status: "Superadmin · acesso liberado", "Trial · X dias restantes", "Plano ativo até DD/MM", ou "Expirado · renovar".

Isso resolve a confusão do "no meu pede pagamento" — sua esposa vai ver na hora se está logada como admin ou outra conta. Arquivo já existe, só adicionar o card.

### 4. SQL para você rodar no Supabase
Já existe `SUPABASE_ADMIN_PROFILES_ACCESS.sql` que dá ao admin permissão de **ler** e **atualizar** todos os perfis. Mas a função `is_fcia_admin()` está hardcoded no e-mail `blindadoemotivado@gmail.com`. Vou gerar um novo arquivo `SUPABASE_MULTI_ADMIN.sql` que:
- Substitui `is_fcia_admin()` por uma versão que retorna `true` se o usuário tem `role='superadmin'` OU é o e-mail mestre (fallback de segurança).
- Mantém as policies existentes funcionando.
- Vou exibir o SQL completo no chat para você copiar e rodar manualmente no SQL Editor (conforme sua regra de memória).

### 5. Sem mudanças em
- `useSubscription.tsx` — já aceita `role='superadmin'` corretamente.
- `ProtectedRoute.tsx` — já aceita.
- `.env` / `subscriptionConfig.ts` — `ADMIN_EMAIL` continua como fallback de emergência (nunca depender só dele).

## Resultado para você

1. Você abre `/admin` (continua funcionando com seu e-mail mestre).
2. Acha o usuário da sua esposa (ou qualquer outro) na lista.
3. Clica **"Tornar admin"** → ela vira superadmin instantaneamente.
4. No próximo refresh do app dela, ela tem acesso liberado e também vê o painel `/admin`.

## Observações

- Não muda o fluxo de login (continua mesmo e-mail/senha funcionando em vários celulares — Supabase já permite).
- Sobre o seu caso específico (você e sua esposa logados na mesma conta `blindadoemotivado@gmail.com` e só o seu pede pagamento): muito provavelmente é **cache do PWA antigo** no seu celular, anterior à regra do superadmin. Recomendo: feche o app, limpe os dados/cache do navegador desse atalho e reabra. Se preferir, posso também subir a versão do `sw.js` para forçar atualização em todos os dispositivos — me diga depois se quer.
