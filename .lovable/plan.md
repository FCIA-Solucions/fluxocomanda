## Problema identificado no `fcia-outro-1x1.mp4`

Ao revisar `remotion/src/scenes/FciaOutro.tsx`, encontrei duas causas do "salto" e da "mudança de perspectiva" do slogan no formato 1:1:

1. **Salto do slogan (jump visual)**
   - `sloganY` anima de `22 → 0` entre os frames 36 e 66.
   - `sloganSpacing` (letter-spacing) anima de `18px → 6px` entre os frames 36 e 76.
   - Como o `letter-spacing` muda **a largura do bloco de texto** enquanto o container está centralizado com `justifyContent: center` + `flexDirection: column` + `gap`, o texto "respira" horizontalmente e parece dar um leve salto/escorregão. No 1:1 isso fica mais perceptível porque o logo ocupa proporcionalmente mais espaço e qualquer reflow do bloco de slogan empurra os elementos vizinhos.
   - Além disso, a `linha sublinhada` aparece no frame 60 com `scaleX` saindo do centro — combinada com o spacing ainda mudando até o frame 76, dá a sensação de "perspectiva mudando".

2. **"Mudança de perspectiva" do slogan**
   - O `<h1>` usa `background: linear-gradient(...) + WebkitBackgroundClip: text` **junto com** `textShadow`. No Chromium headless do render, quando o letter-spacing está animando, o gradient-clip recalcula a cada frame e o `textShadow` (que não é clipado) cria um halo que se desloca em relação ao texto — parece que o texto muda de inclinação/perspectiva.
   - A `<p>` "FCIA · Soluções em Tecnologia" entra no frame 78, exatamente quando o spacing do título ainda está terminando de animar (frame 76). Esses dois eventos quase simultâneos somam o efeito de "tudo mexendo de uma vez".

O 16:9 sofre menos porque há mais largura disponível e o reflow horizontal do bloco fica menos evidente.

## Correção proposta (apenas no `FciaOutro.tsx`)

1. **Eliminar o reflow horizontal do slogan**
   - Remover a animação de `letter-spacing` (`sloganSpacing`) e fixar em um valor estático (ex.: `8px` no 1:1, `10px` no 16:9).
   - Substituir o efeito de "abrir letras" por uma animação que **não muda o layout**: leve `scale` (0.96 → 1) + `filter: blur(6px → 0)` no h1, mantendo a largura constante.

2. **Estabilizar a posição vertical**
   - Reduzir `sloganY` de `22 → 0` para `10 → 0` e encurtar a duração (frame 36 a 54), terminando antes do underline aparecer.
   - Definir `width` fixo no container do slogan (ex.: `90%`) com `textAlign: center`, para que o bloco não dependa da largura intrínseca do texto.

3. **Reduzir o "halo" do gradient-clip**
   - Remover o `textShadow` do h1 (mantendo apenas o gradiente de cor). Opcional: aplicar um `drop-shadow` discreto no container externo para preservar o glow sem deformar o texto.

4. **Reescalonar timings para o quadrado**
   - Antecipar levemente o underline (`lineStart: 60 → 56`) e o brand line (`brandStart: 78 → 72`) para que toda a sequência do slogan termine de forma coesa, sem sobreposições com micro-animações ainda em curso.

5. **Ajuste fino específico do 1:1**
   - Reduzir o `gap` do container central no quadrado (de `24` para `18`) para evitar que o slogan caia muito perto da borda inferior quando o logo aplica o `floatY` sinusoidal.
   - Reduzir levemente a amplitude do `floatY` (de `±6px` para `±3px`) — o float do logo também contribui para a sensação de "salto" no quadrado.

## Renderização

Após aplicar as correções, re-renderizar **apenas o 1:1** para validar:

```
cd remotion && node scripts/render-outro.mjs --only=outro-square
```

Se o script atual não suportar flag de seleção, ajustar o `render-outro.mjs` para aceitar argumento `--only` e renderizar somente `outro-square`, salvando em `/mnt/documents/fcia-outro-1x1.mp4` (sobrescrevendo). O 16:9 não precisa ser re-renderizado, mas as mesmas mudanças beneficiam a versão wide também — opcionalmente regerar ambos.

## Arquivos afetados

- `remotion/src/scenes/FciaOutro.tsx` — ajustes de animação descritos acima
- `remotion/scripts/render-outro.mjs` — (se necessário) suporte a renderizar uma única composição

## Entregável

- `fcia-outro-1x1.mp4` atualizado em `/mnt/documents/`, sem salto do slogan e sem variação de perspectiva durante o reveal.
