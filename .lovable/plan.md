## Objetivo
Gerar um print (PNG) de cada tela do FluxoComanda e disponibilizar todos para download em `/mnt/documents/screenshots/`.

## Telas a capturar
Rotas mapeadas em `src/App.tsx`:

Públicas / Auth:
- `/` (Index / landing)
- `/auth` (Login / cadastro)
- `/reset-password`
- `/instalar`
- `/assinatura`

Área logada (admin):
- `/dashboard`
- `/comandas`
- `/comandas/nova`
- `/comandas/:id` (uma comanda existente, se houver)
- `/produtos`
- `/caixa`
- `/clientes`
- `/relatorios`
- `/meu-negocio`
- `/admin`
- `/status`

## Como vou capturar
1. Usar `browser--navigate_to_sandbox` no viewport mobile (390x844, que é o layout principal do app — `max-w-md`).
2. Para as rotas protegidas: pedir ao usuário que esteja logado no preview (a sessão é compartilhada). Se houver tela de login, vou parar e avisar.
3. Para cada rota: `navigate_to_sandbox` → aguardar render → `browser--screenshot` → salvar PNG em `/mnt/documents/screenshots/<nome-da-tela>.png`.
4. Para `/comandas/:id`, vou abrir `/comandas`, identificar uma comanda existente via `observe`, navegar e capturar.
5. Também gerar uma captura desktop (1366x768) das principais telas (dashboard, relatórios, produtos) para comparação.

## Entrega
- Pasta `/mnt/documents/screenshots/` com um PNG por tela, nomes claros (ex.: `01-landing.png`, `02-auth.png`, `03-dashboard.png`, ...).
- Um arquivo `.zip` com todos os PNGs para download único.
- Lista no chat com os artefatos `<lov-artifact>` para download direto.

## Observação importante
Antes de capturar telas protegidas, **você precisa estar logado no preview** com uma conta admin (para acessar dashboard, produtos, caixa, etc.). Se eu encontrar a tela de login ao tentar acessar uma rota protegida, vou pausar e pedir para você logar antes de continuar.
