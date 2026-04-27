# Atualizar marca "by FCIA" em todo o app

## Texto novo
`by FCIA - Soluções em Tecnologia`

## Link
`https://fcia.lovable.app/desenvolvimento` (abrir em nova aba, `rel="noopener noreferrer"`)

## Arquivos a alterar

### 1. `src/components/SplashScreen.tsx`
- Trocar o rodapé `by <span>FCIA</span>` por um link clicável: `by FCIA - Soluções em Tecnologia` apontando para o novo URL.
- Manter cor verde (#22c55e) na palavra "FCIA" para destaque visual.

### 2. `src/pages/Assinatura.tsx`
- Substituir o bloco final `FluxoComanda é um produto FCIA · fcia.com.br` por:  
  `FluxoComanda é um produto by FCIA - Soluções em Tecnologia` com link para `https://fcia.lovable.app/desenvolvimento` (remover o link antigo `fcia.com.br`).

### 3. `src/lib/pdfReport.ts` (cabeçalho e rodapé do PDF)
- **Cabeçalho:** trocar `by FCIA` por `by FCIA - Soluções em Tecnologia` (apenas texto, sem link — limitação de PDF).
- **Rodapé:** ajustar o crédito para `FluxoComanda · by FCIA - Soluções em Tecnologia`.
- Avaliar tamanho da fonte para o texto não estourar a margem (reduzir 1pt se necessário).

## Fora de escopo
- Não adicionar hyperlink clicável dentro do PDF (jsPDF suporta, mas é trabalho extra; confirme se quiser depois).
- Não alterar nenhum outro texto/marca do app.
