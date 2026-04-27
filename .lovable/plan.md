
## Objetivo
Incrementar a versão do Service Worker para que **todos os celulares** que já instalaram o FluxoComanda como PWA recebam a versão nova automaticamente (limpando o cache antigo) na próxima vez que abrirem o app.

## Como funciona
O navegador detecta mudança no arquivo `sw.js` byte-a-byte. Mudando o nome do `CACHE_NAME` (de `fluxocomanda-v1` para `fluxocomanda-v2`):
1. O SW antigo é considerado "obsoleto" → entra em fase de instalação do novo.
2. `skipWaiting()` ativa o novo SW imediatamente.
3. No `activate`, todos os caches que **não** se chamam `fluxocomanda-v2` são deletados (incluindo `fluxocomanda-v1` antigo).
4. `clients.claim()` faz o novo SW assumir o controle das abas abertas sem precisar fechar/reabrir.

## Mudanças

### 1. `public/sw.js`
- Alterar `CACHE_NAME = "fluxocomanda-v1"` → `CACHE_NAME = "fluxocomanda-v2"`.
- Adicionar comentário com a data da atualização para facilitar futuras revisões.
- (Opcional, mas recomendado) Adicionar listener `message` que aceita `{ type: "SKIP_WAITING" }` — permite no futuro forçar update via botão na UI sem precisar fechar o app.

### 2. `src/main.tsx`
- Adicionar, junto ao `register("/sw.js")`, um listener `updatefound` que recarrega a página automaticamente quando um SW novo termina de instalar e assume o controle. Isso garante que, mesmo se o usuário ficar com o app aberto, ele veja a versão nova após alguns segundos sem precisar reinstalar.

```ts
navigator.serviceWorker.register("/sw.js").then((reg) => {
  reg.addEventListener("updatefound", () => {
    const newSW = reg.installing;
    if (!newSW) return;
    newSW.addEventListener("statechange", () => {
      if (newSW.state === "activated" && navigator.serviceWorker.controller) {
        // Nova versão ativada — recarrega para pegar os assets novos
        window.location.reload();
      }
    });
  });
});
```

## O que o usuário vai ver
- **Celular da esposa** (já com app aberto): ao abrir o app, ele detecta a nova versão, recarrega sozinho em ~2 segundos e passa a usar `v2`.
- **Seu celular**: mesma coisa — abre o app, recarrega sozinho, e a regra do `superadmin` (que já está no código) passa a valer.
- **Sem necessidade de desinstalar/reinstalar** o atalho.

## Não faz parte deste plano
- Não vou mexer no manifest, ícones, ou na lógica de assinatura — só na invalidação de cache.
- Não vou registrar SW em ambiente de preview (continua bloqueado em iframe e em hosts `id-preview--` / `lovableproject.com`).

## Próximos passos depois de aplicar
1. Aguardar o deploy concluir em `fluxocomanda.lovable.app`.
2. Abrir o app instalado em cada celular **uma vez** (mesmo que dê para reusar o atalho na home).
3. Em até 10 segundos, o app recarrega sozinho com a versão nova.
4. Caso algum dispositivo demore (raro), basta fechar e abrir o app novamente.
