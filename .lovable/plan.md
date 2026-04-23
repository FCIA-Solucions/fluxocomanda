

## Problema

Seu amigo abriu `https://fluxocomanda.lovable.app` no Android e nada apareceu para instalar. A causa real **não é** o `beforeinstallprompt` — é que ele **nunca chegou na tela onde o banner mora**:

1. Ele entra em `/` → redireciona para `/dashboard`
2. `/dashboard` é rota protegida → como ele não tem login, é mandado para `/auth`
3. O componente `<InstallBanner />` está montado **somente dentro do `Dashboard`**, que ele nunca vê
4. Resultado: zero chance de instalar pelo banner do app

Além disso, mesmo se fosse uma tela pública, o Chrome no Android **só mostra o prompt nativo de instalação** depois que o usuário tem um certo "engajamento" (alguns segundos de uso, scroll, clique). Para um visitante que abre e fecha rápido, o evento nem dispara.

## Solução

### 1. Mostrar o banner também na tela de login (`/auth`)
Renderizar `<InstallBanner />` no topo da página `/auth`, para que qualquer visitante (logado ou não) veja o convite de instalar.

### 2. Criar uma página pública dedicada `/instalar`
Página simples explicando o app e com botão "Instalar agora" — funciona em qualquer dispositivo:
- **Android (Chrome/Edge):** dispara o prompt nativo se disponível, senão mostra instruções com print do menu ⋮ → "Instalar app"
- **iPhone (Safari):** mostra instruções "Compartilhar → Adicionar à Tela de Início"
- **Desktop:** mostra QR code apontando para `https://fluxocomanda.lovable.app/instalar` para o visitante abrir no celular

Esse é o link "amigável" para compartilhar com clientes/amigos: `fluxocomanda.lovable.app/instalar`

### 3. Reforçar a captura do `beforeinstallprompt` globalmente
O listener já foi movido para o `main.tsx` na rodada anterior. Vou garantir que o `InstallBanner` na tela `/auth` também consuma o evento já capturado e não dependa do timing do React montar.

### 4. Remover o critério "dismissado para sempre" quando o usuário acessa `/instalar`
Se ele entrou explicitamente na página de instalar, ignora o `localStorage` de dispensar — afinal, ele veio justamente para instalar.

## Arquivos a alterar

- `src/pages/Auth.tsx` — renderizar `<InstallBanner />` no topo, antes do form de login
- `src/pages/Instalar.tsx` (novo) — página pública dedicada à instalação, com detecção de SO, botão de instalar, instruções visuais e QR code para desktop
- `src/App.tsx` — registrar a rota pública `/instalar` (sem `ProtectedRoute`)
- `src/components/InstallBanner.tsx` — pequeno ajuste: aceitar prop `forceShow` para ignorar o dismiss persistido quando vier da página `/instalar`
- *(opcional)* `index.html` — adicionar meta tag `<meta name="apple-mobile-web-app-title" content="FluxoComanda">` já está, então só revisar

## Como testar depois

1. Compartilhe `https://fluxocomanda.lovable.app/instalar` com o amigo
2. Ele abre no Chrome do Android → vê a página com botão "Instalar agora"
3. Clica → ou abre o prompt nativo, ou vê as instruções do menu ⋮
4. App instalado na tela inicial em ~10 segundos

## Observação importante

Mesmo com tudo isso configurado, o Chrome Android pode **não disparar o prompt nativo na primeira visita** — isso é uma regra do próprio Chrome (precisa de engajamento). Por isso o fallback com instruções manuais é essencial e cobre 100% dos casos.

