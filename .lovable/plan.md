## Objetivo
Deixar **claro visualmente** na tela "Nova Comanda" que o usuário pode abrir uma comanda **sem cadastrar o cliente** (apenas com nome/mesa livre), mantendo a opção de cadastrar quando quiser.

## Situação atual
O sistema **já aceita** abrir comanda sem cadastrar (basta digitar e clicar "Criar Comanda" — fica salvo como texto livre, `customer_id = null`). Mas o dropdown de busca só destaca a ação "Cadastrar novo cliente", o que passa a impressão errada de que é obrigatório.

## Mudanças

### 1. `src/components/CustomerAutocomplete.tsx`
No dropdown que aparece quando o usuário digita 2+ letras e não selecionou ninguém, **adicionar uma opção acima** do "Cadastrar novo cliente":

```text
┌──────────────────────────────────────┐
│ [resultados encontrados, se houver]  │
├──────────────────────────────────────┤
│ ✓ Usar "Mesa 3" sem cadastrar        │  ← NOVA opção (fecha o dropdown)
├──────────────────────────────────────┤
│ + Cadastrar novo: "Mesa 3"           │  ← já existia
└──────────────────────────────────────┘
```

Ao clicar em "Usar sem cadastrar":
- mantém o texto digitado
- limpa qualquer seleção (`onSelect(null)`)
- fecha o dropdown (`setOpen(false)`)
- usuário clica "Criar Comanda" e a comanda é criada com texto livre

### 2. `src/pages/NovaComanda.tsx`
Pequeno ajuste no texto de ajuda abaixo do input, deixando explícito:

> "Digite o nome ou mesa. Você pode cadastrar como cliente ou abrir direto sem cadastro."

(Substitui o atual "Digite ao menos 2 letras para buscar clientes cadastrados.")

## O que **não** muda
- Lógica de criação da comanda (já funciona com texto livre).
- Banco de dados — nenhuma migração necessária.
- Fluxo de cadastro de cliente continua igual, só fica explicitamente opcional.

## Verificação
Após implementar, abrir `/comandas/nova` no preview, digitar "Mesa 5" e confirmar que aparecem as duas opções no dropdown. Capturar screenshot.
