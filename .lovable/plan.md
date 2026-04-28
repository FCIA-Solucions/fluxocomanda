## Objetivo

Limpar a cena de abertura ("Hook", 0-4s) do vídeo demonstrativo, removendo o mockup de celular com a logo que aparece sobreposto ao texto "Cansado de anotar comanda no papel?".

## Mudanças

### 1. `remotion/src/scenes/Hook.tsx`
- Remover todo o bloco do mockup do celular (o `div` com `position: absolute`, `bottom: "8%"`, contendo a `<Img>` da logo).
- Remover variáveis de animação não utilizadas: `appScale` e `appOpacity`.
- Remover imports não utilizados: `spring`, `useVideoConfig`, `Img`, `staticFile`.
- Manter apenas o texto centralizado com sua animação de subida (fade + translateY).
- Resultado: cena limpa, com apenas a pergunta de impacto em destaque, deixando o "wow" visual da logo para a cena `Logo.tsx` (4-9s).

### 2. Re-renderizar o vídeo
- Executar `node remotion/scripts/render-remotion.mjs` para gerar novo `fluxocomanda-demo-silent.mp4`.
- QA: extrair frames em T=15, T=45, T=90 com ffmpeg para confirmar que o texto aparece sozinho e sem sobreposições.

## Observações
- O roteiro de narração (`FluxoComanda-Roteiro-Narracao.txt`) **não** precisa ser alterado — os timecodes da cena Hook (0-4s) continuam válidos pois a duração da cena permanece a mesma.
- A logo continua aparecendo de forma forte na cena seguinte (Logo, 4-9s) e na cena final (CTA).
