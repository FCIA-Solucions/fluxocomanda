

# Fase 2 — Dashboard funcional + CRUD de Produtos

## 1. `src/pages/Dashboard.tsx` (reescrever)

Carregar 4 métricas em paralelo via `Promise.all`:
- **Vendas Hoje**: `sales.select('total').gte('created_at', todayISO).eq('user_id', uid)` → soma
- **Comandas Abertas**: `orders.select('id', { count: 'exact', head: true }).eq('status','open').eq('user_id', uid)`
- **Comandas Fechadas Hoje**: `orders.select('id', { count: 'exact', head: true }).eq('status','closed').gte('closed_at', todayISO)`
- **Ticket Médio**: somaVendas / qtdVendas (0 se vazio)

Layout:
- Header com saudação + botão sair (mantém atual)
- Grid 2x2 de cards de resumo (`grid-cols-2 gap-3`)
  - Cada card: label pequeno + valor grande + ícone `lucide`
  - Skeleton enquanto `loading`
- Mensagem "Nenhuma venda hoje ainda 🙂" se `vendasHoje === 0` (acima dos botões)
- Botão verde full-width 64px: "+ Nova Comanda" → `navigate('/comandas')` (rota nova ainda não existe)
- Botão outline full-width: "Ver Comandas" → `navigate('/comandas')`

Formatação BRL via `Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' })`.

## 2. `src/pages/Produtos.tsx` (reescrever)

Estado: `products`, `loading`, `sheetOpen`, `editing` (produto sendo editado ou null), `deleteTarget`.

### Carga
`supabase.from('products').select('*').eq('user_id', uid).order('created_at', { ascending: false })`.
Sem filtro de `active` — lista mostra todos com badge.

### Lista
- Cards (um por linha): nome (bold) + preço BRL + badge "Ativo"/"Inativo" + Switch + botão lixeira
- Toque no card (área não-controle) abre sheet em modo edição
- Estado vazio centralizado: "Nenhum produto cadastrado. Toque em + para adicionar."

### FAB
Botão fixo `bottom-24 right-4` (acima do BottomNav), `h-14 w-14 rounded-full`, ícone `Plus`, `bg-primary`. Abre sheet em modo criação.

### Sheet (`side="bottom"`)
- Título: "Novo produto" / "Editar produto"
- Inputs: Nome (obrigatório), Preço (máscara BRL — guarda centavos como number, formata na exibição)
- Implementação da máscara: input controlado, parse `onChange` removendo não-dígitos, divide por 100, formata com `Intl`. Salva como `number` (reais, ex. 12.50).
- Botão Salvar `h-14` full-width

### Mutations
- Create: `insert({ user_id, name, price, active: true })`
- Update: `update({ name, price }).eq('id', editing.id)`
- Toggle ativo: `update({ active: !p.active }).eq('id', p.id)` direto no card
- Soft delete: AlertDialog "Desativar produto?" → `update({ active: false })`

Toasts (sonner) em cada operação. Refetch da lista após cada mutation (ou update otimista no array local).

## 3. Sem mudanças em schema/SQL

Tabelas `products`, `orders`, `sales` já existem com os campos necessários (visto em `database.types.ts`). RLS já aplica filtro por `user_id`.

## 4. Componentes shadcn usados
Já instalados: `sheet`, `alert-dialog`, `switch`, `badge`, `skeleton`, `card`, `button`, `input`, `label`. Não preciso adicionar nada.

## Critério de pronto
- Dashboard mostra 4 métricas reais; skeleton durante load; mensagem de vazio quando zero vendas.
- "+ Nova Comanda" e "Ver Comandas" navegam para `/comandas`.
- Lista de produtos popula do banco, vazio mostra mensagem.
- FAB abre sheet inferior; criar/editar/toggle/desativar funcionam com toast.
- Máscara BRL no input de preço.
- Tudo via Supabase, zero mock.

