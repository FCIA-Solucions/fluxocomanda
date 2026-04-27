## Vídeo demonstrativo do FluxoComanda

Vou produzir um vídeo de **45 segundos no formato quadrado 1080x1080** (ideal para Instagram Feed e WhatsApp), todo animado em código com Remotion + React, seguindo a identidade visual real do app (fundo dark slate + verde #22c55e + fonte Inter). O resultado será um arquivo MP4 pronto para baixar.

### Direção criativa

- **Estilo**: Tech Product — limpo, geométrico, transições snappy. Mockups de celular animados mostrando o app em ação.
- **Paleta** (extraída do app):
  - Fundo: `#0F172A` (slate 900)
  - Card/UI: `#1E293B`
  - Verde primário: `#22C55E`
  - Texto: `#F8FAFC` / muted `#94A3B8`
- **Tipografia**: Inter (já é a fonte do app), pesos 400/600/700.
- **Motivos**: cards arredondados (radius 1rem), grid sutil ao fundo, ícones lucide animados, "blobs" verdes desfocados se movendo lentamente.

### Roteiro (45s — 1350 frames @ 30fps)

```text
┌─ 0s–4s   HOOK            "Cansado de anotar comanda no papel?"
│                          Papel rasgando → app aparece no celular
├─ 4s–9s   LOGO/PROMESSA   Logo FluxoComanda + tagline
│                          "Suas comandas, seu caixa, no seu bolso."
├─ 9s–17s  CENA 1          Agilidade: abrir comanda + lançar produto
│                          Mockup celular: digita "Mesa 7" → tap em itens
├─ 17s–25s CENA 2          Caixa: vendas entrando por Pix/Cartão/Dinheiro
│                          Cards animados com R$ subindo + barras
├─ 25s–32s CENA 3          Relatórios: gráfico de barras crescendo
│                          "Saiba quanto vendeu, quando e como"
├─ 32s–38s CENA 4          PWA: ícone do app pulando pra tela inicial
│                          "Instala no celular, funciona offline"
├─ 38s–45s CTA FINAL       Logo + "7 dias grátis · fluxocomanda.lovable.app"
└─                         WhatsApp (94) 99955-3574
```

### Componentes técnicos

- **Setup**: pasta `remotion/` no projeto com Bun + Remotion 4 + transitions + google-fonts (Inter).
- **Render programático** via `scripts/render-remotion.mjs` (chrome-for-testing, muted=true para encode, depois faço o mux do áudio com ffmpeg).
- **Composição principal** `main` 1080x1080 @ 30fps, 1350 frames.
- **Cenas individuais** em `src/scenes/`:
  - `Hook.tsx`, `Logo.tsx`, `Comanda.tsx`, `Caixa.tsx`, `Relatorios.tsx`, `PWA.tsx`, `CTA.tsx`
- **Mockup de celular**: componente `PhoneFrame.tsx` reusável (moldura escura com notch, viewport 9:19) reproduzindo telas reais do app com Tailwind.
- **Layers persistentes**: gradiente animado de fundo + 3 blobs verdes desfocados drift lento, atravessando todas as cenas.
- **Transições**: `wipe` direcional + `slide` com `springTiming` entre cenas — consistente em todas.
- **Música**: gerada via ElevenLabs Music API (precisa do segredo `ELEVENLABS_API_KEY`). Prompt: *"upbeat corporate tech background music, modern, optimistic, light percussion, no vocals, 45 seconds"*. Mux via ffmpeg no MP4 final.
  - Fallback: se a chave não estiver disponível, entrego o vídeo sem áudio e te aviso.

### Animação por cena (resumo das técnicas)

| Cena | Animações principais |
|---|---|
| Hook | papel rasgando (clip-path animado), celular sobe com spring damping 12 |
| Comanda | typing simulado da palavra "Mesa 7", produtos entrando staggered (delay 6f), badge de qtd contando |
| Caixa | 3 cards (Pix/Cartão/Dinheiro) com valores interpolando R$ 0 → R$ X, barras crescendo width |
| Relatórios | barras de gráfico crescendo individualmente com spring, números do topo contando |
| PWA | ícone do app pula da tela do navegador para a home do celular (translate + scale spring) |
| CTA | logo escala in + botões pulsam suavemente com seno |

### Entregáveis

1. `/mnt/documents/fluxocomanda-demo.mp4` — vídeo final 1080x1080, ~45s, com música.
2. Código-fonte versionado em `remotion/` no projeto (você poderá pedir ajustes/re-render depois sem refazer do zero).

### Pré-requisito

Para gerar a trilha musical preciso da chave **`ELEVENLABS_API_KEY`** configurada no Lovable Cloud. Se ainda não estiver, vou pedir antes de renderizar a parte de áudio. O vídeo visual é renderizado independente disso.

### Próximo passo

Aprove este plano e eu já entro em modo de implementação: monto o projeto Remotion, gero a música, renderizo o MP4 e te entrego o link de download.