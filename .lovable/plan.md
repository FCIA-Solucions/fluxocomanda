# Remover papel branco da cena de abertura

## Problema
Na primeira cena (Hook, 0–4s) aparece uma folha de papel bege/branca simulando a comanda manuscrita ("Mesa 7 — 2x Coca-Cola..."). Ela cobre parte do texto "Cansado de anotar comanda no papel?" e polui visualmente a abertura.

## Solução
Editar `remotion/src/scenes/Hook.tsx`:

1. **Remover o bloco do papel** — apagar o `<div>` que renderiza a folha (com `clipPath`, fundo `#f5efe0`, "Mesa 7 — Comanda" e a lista de itens) e as variáveis `tear` e `paperOpacity` que só servem a ele.
2. **Manter o texto** "Cansado de anotar comanda no papel?" centralizado, com a mesma animação de subida/fade.
3. **Manter o reveal do celular com a logo** no final da cena (frame 65+), agora podendo aparecer mais centralizado já que o papel não ocupa mais espaço — ajustar `bottom` para algo como `15%` para ficar bem enquadrado abaixo do título.
4. **Pequeno ajuste de timing**: como não há mais o "ato" do papel rasgando, antecipar levemente o reveal do celular (de frame 65 para ~50) para a cena não ficar parada.

## Re-renderização
Após a edição, rodar novamente o script de render do Remotion para gerar a nova versão:
- `node remotion/scripts/render-remotion.mjs`
- Saída substitui `/mnt/documents/fluxocomanda-demo-silent.mp4`

## Não muda
- Roteiro de narração (`FluxoComanda-Roteiro-Narracao.txt`) permanece igual — os timecodes do Hook (0–4s) continuam válidos.
- Demais cenas (Logo, Comanda, Caixa, Relatórios, PWA, CTA) ficam intactas.
- Duração total do vídeo permanece ~42s.
