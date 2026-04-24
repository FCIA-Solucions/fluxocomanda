

## Verificação de comanda duplicada antes de criar

### Arquivo
`src/pages/NovaComanda.tsx`

### Fluxo
Ao clicar em **Criar Comanda** (ou pressionar Enter):

1. Validar nome (já existe).
2. **Checar duplicidade** no banco antes do `INSERT`:
   ```ts
   const { data: existing } = await supabase
     .from("orders")
     .select("id, customer_name, total, created_at")
     .eq("status", "open")
     .ilike("customer_name", `%${trimmed}%`)
     .order("created_at", { ascending: false })
     .limit(3);
   ```
   O RLS já filtra pelo owner correto (admin/garçom).
3. Se `existing.length > 0` → abrir **AlertDialog** com a comanda mais recente.
4. Se vazio → criar normalmente (fluxo atual).

### Modal de aviso (AlertDialog)
Conteúdo:

- Título: `⚠️ Comanda já existe`
- Texto:
  - `Já existe uma comanda aberta para "{customer_name}"`
  - `💰 Valor parcial: R$ {total}`
  - `🕐 Aberta às: {HH:mm}`
- Botões (verticais, full-width, mobile-first):
  1. **📋 Ver comanda existente** (primário) → fecha modal e `navigate('/comandas/{id}', { replace: true })`. Não cria nova.
  2. **➕ Abrir nova mesmo assim** (variant `secondary`) → fecha modal e prossegue com o `INSERT` normal.
  3. **✕ Cancelar** (variant `ghost`/cancel) → só fecha o modal, mantém o nome digitado para correção.

### Estados
- `checking: boolean` — durante o SELECT (botão mostra "Verificando…", `disabled`).
- `saving: boolean` — durante o INSERT (já existe, mostra "Criando…").
- `duplicateOpen: boolean` — controla o AlertDialog.
- `duplicateOrder: { id, customer_name, total, created_at } | null` — dados da comanda mais recente encontrada.

### Detalhes técnicos
- Busca **case-insensitive** via `.ilike` com `%${trimmed}%`.
- Filtra somente `status = 'open'`.
- Se múltiplas, exibe a **mais recente** (`order created_at desc, limit 3`, usa `[0]`).
- Botão "Abrir nova mesmo assim" faz bypass — chama uma função interna `doInsert()` que pula a verificação.
- Formatação: `brl.format(Number(total))` e `Intl.DateTimeFormat("pt-BR", { hour:"2-digit", minute:"2-digit" })` (mesmo padrão de `Comandas.tsx`).
- Ícones: `AlertTriangle`, `Eye`, `Plus`, `X` do `lucide-react`.

### O que NÃO muda
- Layout da tela `NovaComanda` (header, input, botão).
- Nenhuma alteração em `Comandas.tsx`, banco, RLS ou outros arquivos.

