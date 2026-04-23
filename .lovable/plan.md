
## Status atual da implementação

Boa notícia: a maior parte do que você pediu já está no código (do turno anterior). Vou só confirmar o que está pronto e listar os ajustes pequenos que faltam.

### Já implementado ✅

| Item | Onde | Status |
|---|---|---|
| 1. Hook `useProfile()` com `role`, `ownerId`, `effectiveUserId` | `src/hooks/useProfile.tsx` | OK |
| 2. Menu condicional (garçom vê só Comandas) | `src/components/BottomNav.tsx` | OK |
| 3a. Botão "Cancelar item" oculto p/ garçom | `ComandaDetalhe.tsx` linha 417 | OK |
| 3b. Comandas usa `effectiveUserId` (garçom vê dados do dono) | `Comandas.tsx`, `NovaComanda.tsx`, `ComandaDetalhe.tsx` | OK |
| 3c. Garçom não tem acesso a Dashboard/Caixa/Relatórios (= não vê faturamento total do dia) | `App.tsx` rotas com `adminOnly` + redirect em `Index.tsx` | OK |
| 4. Card "Modo Demonstração" só p/ admin em Meu Negócio | `MeuNegocio.tsx` linhas 279-305 | OK |
| 5. Card "Equipe" com gate de upgrade só p/ admin | `MeuNegocio.tsx` linhas 236-276 | OK |

### Ajustes pequenos a fazer

**A. Card "Equipe" — trocar redirect para WhatsApp (item 5 do briefing)**
Hoje o botão "Fazer upgrade →" navega para `/assinatura`. O briefing pede um link WhatsApp pré-preenchido. Vou alterar para abrir:
```
https://wa.me/5594999553574?text=Olá!+Quero+fazer+upgrade+do+FluxoComanda+para+adicionar+garçons.+Meu+email:+<email>
```
Usando `useAuth().user?.email` ou `useProfile().email` para preencher.

**B. Card "Equipe" — enriquecer copy conforme briefing**
Adicionar as linhas dos planos:
- "Plano Padrão — até 3 garçons · R$ 49,90/mês"
- "Plano Profissional — até 8 garçons · R$ 79,90/mês"

Botão muda para: `💬 Fazer upgrade via WhatsApp →`

**C. "Aplicar desconto" — não existe**
Procurei no código e não há funcionalidade de desconto em `ComandaDetalhe.tsx`. Não há botão para ocultar — nada a fazer aqui.

**D. "Faturamento total do dia" para garçom — já protegido**
Garçom não acessa Dashboard/Caixa/Relatórios (rotas `adminOnly`). Em `Comandas.tsx` só aparecem valores por comanda individual, não soma. Conforme.

### Arquivos que serão editados

- `src/pages/MeuNegocio.tsx` — apenas o bloco do card "Equipe" (linhas 236-276): trocar destino do botão e adicionar copy dos planos.

### Teste manual após o ajuste (item 6 do briefing)

Você vai rodar:
1. Login com `garcom.demo@fluxocomanda.app` / `Demo@2026`
2. Confirmar que o menu inferior mostra apenas "Comandas"
3. Confirmar que as comandas do admin aparecem (depende da migration SQL `effective_owner` já estar aplicada no Supabase)
4. Abrir uma comanda e confirmar que o ícone de lixeira (remover item) está oculto
5. Logar de volta como admin → ir em "Negócio" → ver os dois cards (Demo + Equipe com botão WhatsApp)

> ⚠️ Se a migration SQL ainda não foi rodada no Supabase, o garçom não verá nada. O SQL está em `docs/sql/20260423_add_roles_and_owner.sql` e foi compartilhado nas mensagens anteriores.
