

## Adicionar branding FCIA ao FluxoComanda

Adicionar identidade da marca FCIA (empresa) em pontos estratégicos do app, mantendo o FluxoComanda como produto principal.

### 1. Asset da logo FCIA
Copiar a imagem enviada (`user-uploads://logo.png`) para `src/assets/fcia-logo.png` para uso nos componentes (splash + rodapé do login).

### 2. Splash Screen (novo componente)
Criar `src/components/SplashScreen.tsx`:
- Tela cheia, fundo `#0f172a`
- Centro: ícone do FluxoComanda (`/icon-192.png`) com leve animação (fade+scale)
- Texto "FluxoComanda" abaixo (bold)
- Rodapé: "by **FCIA**" (muted, FCIA em destaque verde `#22c55e`)
- Duração: 2 segundos, depois fade-out suave

Integrar em `src/App.tsx`:
- Estado `showSplash` controlado por `sessionStorage` (mostra apenas 1x por sessão para não atrapalhar navegação interna)
- Renderizar `<SplashScreen />` por cima das rotas enquanto `showSplash === true`

### 3. Rodapé na tela /auth
Em `src/pages/Auth.tsx`, abaixo do card branco do formulário (depois de `</div>` do card, antes do fechamento do container):
```
Um produto
[logo FCIA pequena] FCIA       ← bold, verde
Soluções Inteligentes          ← muted pequeno
```
Layout vertical centralizado, espaçamento `mt-8`.

### 4. Rodapé na tela /assinatura
Em `src/pages/Assinatura.tsx`, adicionar abaixo do botão "Sair da conta":
- Texto pequeno muted centralizado: "FluxoComanda é um produto **FCIA** · [fcia.com.br](https://fcia.com.br)"

### 5. Card "Sobre o app" em /meu-negocio
Em `src/pages/MeuNegocio.tsx`, adicionar como última seção (após o botão Salvar):
- Card com fundo `bg-card` arredondado
- Linha 1: "FluxoComanda **v1.0**"
- Linha 2: "Desenvolvido por FCIA Soluções Inteligentes"
- Linha 3: link clicável → https://fciapremium.lovable.app/ (abre em nova aba)
- Linha 4 (muted, xs): "© 2026 FCIA. Todos os direitos reservados."

### 6. PWA manifest
Em `public/manifest.json`, atualizar campo `description`:
```
"FluxoComanda — Um produto FCIA. Comanda digital para comércios locais."
```

### Detalhes técnicos
- Logo FCIA usada apenas no splash (acima do "by FCIA") e como ícone pequeno no rodapé do /auth — em `src/assets/` para bundling otimizado, importada como módulo ES6.
- A cor verde `#22c55e` no destaque "FCIA" é fixa (identidade da marca FCIA), independente da `brand_color` que o usuário escolher em Meu Negócio.
- Splash usa `sessionStorage` (não `localStorage`) para reaparecer a cada nova sessão do navegador, mas não em cada navegação.
- Sem alterações no banco de dados.

### Arquivos afetados
- `src/assets/fcia-logo.png` (novo, copiado do upload)
- `src/components/SplashScreen.tsx` (novo)
- `src/App.tsx` (integrar splash)
- `src/pages/Auth.tsx` (rodapé FCIA)
- `src/pages/Assinatura.tsx` (rodapé FCIA)
- `src/pages/MeuNegocio.tsx` (card "Sobre o app")
- `public/manifest.json` (description)

