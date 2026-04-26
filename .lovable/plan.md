
# Manual de Uso dentro do app

Manual contextual acessível em qualquer tela através de um ícone **?** fixo no header (ao lado do botão Sair). Abre um **Drawer** lateral (Sheet do shadcn) com todo o conteúdo organizado em **acordeão**, e o conteúdo se adapta ao **role** do usuário (admin/superadmin × garçom).

---

## 1. Arquitetura

### Novos arquivos
- `src/components/help/HelpDrawer.tsx` — Drawer global (usa `Sheet` do shadcn, lado direito)
- `src/components/help/HelpButton.tsx` — Ícone `HelpCircle` que abre o drawer
- `src/components/help/helpContent.tsx` — Conteúdo do manual (estruturado, por role)
- `src/hooks/useHelp.tsx` — Context com `open/setOpen` para abrir o drawer de qualquer lugar (opcional, mas útil pra futuros "ajuda contextual" por tela)

### Arquivos alterados
- `src/components/AppShell.tsx` — adiciona o `HelpButton` no header, ao lado do botão Sair, e renderiza o `HelpDrawer`
- `src/App.tsx` — envolve as rotas com `HelpProvider` (se usarmos o context)

### Por que Drawer (Sheet) e não Dialog?
- Drawer lateral funciona bem em mobile (o app é mobile-first, `max-w-md`)
- Permite scroll longo confortável
- Não bloqueia visualmente — o usuário pode arrastar pra fechar

---

## 2. Acesso (UI)

No `AppShell`, no canto superior direito, ficarão **dois botões circulares lado a lado**:

```
[ ? ]  [ ⎋ ]
```

- `?` = `HelpCircle` (lucide) → abre o `HelpDrawer`
- `⎋` = `LogOut` (já existe) → signOut

Ambos com mesmo estilo: `h-10 w-10 rounded-full bg-card/80 backdrop-blur`.

O botão **só aparece se o usuário estiver logado** (mesma regra do botão Sair).

---

## 3. Estrutura do conteúdo (helpContent.tsx)

Cada item é um objeto `{ id, title, icon, roles: ['admin','garcom'], content: ReactNode }`. O drawer filtra por `role` antes de renderizar.

### Para **admin / superadmin** (todas as funcionalidades)

1. **🏠 Início (Dashboard)**
   - O que cada métrica significa: Vendas Hoje, Comandas Abertas, Fechadas Hoje, Ticket Médio
   - Botão "Nova Comanda" e "Ver Comandas"
   - Banners de assinatura e instalação do app

2. **📋 Comandas**
   - Como abrir uma nova comanda (cliente, mesa, garçom)
   - Lançar produtos: buscar, ajustar quantidade, observação
   - Editar/remover itens
   - Fechar comanda: forma de pagamento, desconto, gerar PDF/recibo
   - Status: aberta × fechada × cancelada
   - Filtros e busca

3. **📦 Produtos**
   - Cadastrar produto (nome, preço, categoria, estoque opcional)
   - Editar e desativar produto
   - Categorias: como organizar
   - Importação/ordenação

4. **💰 Caixa**
   - Abrir caixa (saldo inicial)
   - Sangria e suprimento
   - Fechar caixa (resumo por forma de pagamento, divergências)
   - Histórico de fechamentos
   - Auto-fechamento (se configurado)

5. **👥 Clientes**
   - Cadastro rápido durante a comanda
   - Histórico de consumo
   - Editar/remover

6. **📊 Relatórios**
   - Filtro por período
   - Vendas por dia / por produto / por garçom / por forma de pagamento
   - Exportar PDF

7. **🏪 Meu Negócio**
   - Nome, logo, dados de contato
   - Configurações fiscais e de impressão
   - Cor primária / branding
   - Convidar garçons e gerenciar equipe (link para Admin se for superadmin)

8. **💎 Assinatura**
   - Como ver status e vencimento
   - Renovar via PIX e WhatsApp
   - Planos disponíveis (Trial, Mensal, Semestral, Vitalício)

9. **🛡️ Admin** (só superadmin)
   - Ver/gerenciar todos os usuários
   - Estender trial / mudar plano de outros usuários
   - Página /status para diagnóstico

10. **❓ FAQ rápido**
    - "Esqueci a senha" → reset
    - "Como instalar o app no celular" → /instalar
    - "Garçom não aparece na lista" → conferir cadastro em Admin
    - "Comanda sumiu" → checar filtro/status
    - "Suporte" → WhatsApp

### Para **garçom** (versão enxuta)

1. **📋 Como abrir uma comanda**
2. **➕ Como lançar pedidos**
3. **✏️ Como corrigir um item**
4. **✅ Como fechar a comanda**
5. **❓ Suporte** (WhatsApp do estabelecimento + FluxoComanda)

---

## 4. UX do Drawer

- **Cabeçalho** fixo: título "Manual de uso" + subtítulo "FluxoComanda · v1.0"
- **Busca** simples (input no topo) que filtra tópicos por título — opcional, mas recomendado
- **Acordeão** (`Accordion` do shadcn) com todos os tópicos do role atual; primeiro aberto por padrão
- **Rodapé fixo**: "Não encontrou o que procurava?" + botão verde "Falar no WhatsApp" → abre `wa.me/5594999553574` com mensagem pré-pronta
- Largura: `w-full sm:max-w-md` (cobre tela em mobile, lateral em desktop)
- Scroll interno com `ScrollArea`

---

## 5. Detecção de role

Já temos `useProfile()` retornando `role`. No `HelpDrawer`:

```tsx
const { role } = useProfile();
const items = helpContent.filter(item => item.roles.includes(role));
```

`superadmin` vê tudo de admin **+** o item "Admin".

---

## 6. Fora do escopo (pode entrar depois)

- Ajuda contextual por tela (ex.: dentro de `/caixa`, abrir já no tópico "Caixa")
- Vídeos curtos / GIFs animados de cada fluxo
- Tour guiado (highlight nos botões) — biblioteca tipo `react-joyride`
- Versionamento do manual / changelog visível

---

## 7. Resumo das mudanças

| Arquivo | Ação |
|---|---|
| `src/components/help/HelpDrawer.tsx` | **novo** |
| `src/components/help/HelpButton.tsx` | **novo** |
| `src/components/help/helpContent.tsx` | **novo** |
| `src/components/AppShell.tsx` | adicionar botão `?` + montar `HelpDrawer` |

Sem mudanças no banco, sem novas rotas, sem dependências externas.
