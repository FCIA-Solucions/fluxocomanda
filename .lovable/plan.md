## Por que o painel está vazio

A tabela `subscriptions` tem 0 linhas (confirmado pela API: `[]`). Os dados de plano dos usuários estão em `profiles` (`subscription_status`, `trial_ends_at`, `subscription_expires_at`). Vamos trocar a fonte do painel para `profiles`, que já lista todos os clientes cadastrados.

## Mapeamento de campos

| Painel (hoje, subscriptions) | Novo (profiles) |
|---|---|
| `nome_negocio` | `business_name` |
| `email` | `email` |
| `plano` (trial/mensal/vitalicio) | derivado de `subscription_status` |
| `ativo` (bool) | derivado de `subscription_status` (≠ "inativo"/"blocked") |
| `trial_ends_at` | `trial_ends_at` |
| `subscription_expires_at` | `subscription_expires_at` |

**Convenção em `subscription_status`** (string livre hoje):
- `trial` → plano trial
- `active` ou `mensal` → plano mensal
- `vitalicio` ou `lifetime` → plano vitalício
- `inactive` / `blocked` → desativado

## Mudanças no código

### 1. `src/pages/Admin.tsx` — refatorar para ler de `profiles`

- Trocar tipo `SubscriptionRow` → `ProfileRow` com colunas: `id, business_name, email, subscription_status, trial_ends_at, subscription_expires_at, role, created_at`.
- Query: `supabase.from("profiles").select("id, business_name, email, subscription_status, trial_ends_at, subscription_expires_at, role, created_at").order("created_at", { ascending: false })`.
- Adicionar **funções de mapeamento**:
  - `getPlano(status)` → `'trial' | 'mensal' | 'vitalicio'`
  - `getAtivo(status)` → `boolean` (false se status for `inactive`/`blocked`)
- Manter busca por `business_name` ou `email`.
- Manter dialog de "Definir plano":
  - **Salvar** atualiza `profiles.subscription_status` + `trial_ends_at` ou `subscription_expires_at` conforme o plano escolhido (trial → grava `subscription_status='trial'` + `trial_ends_at`; mensal → `subscription_status='active'` + `subscription_expires_at`; vitalício → `subscription_status='vitalicio'`, ambas datas null).
- Botão **Ativar/Desativar**:
  - Desativar → `subscription_status='inactive'`
  - Ativar → restaura para `'trial'` (ou `'active'` se houver `subscription_expires_at` futuro; `'vitalicio'` se for vitalício). Lógica simples: se tiver `subscription_expires_at` futuro → `active`; senão → `trial`.
- Esconder garçons (`role='garcom'`) opcionalmente — o painel é de **clientes** (donos). Filtrar `role='admin'` no client. *(Ou mostrar todos com badge de role — recomendo filtrar só donos.)*
- `StatusBadge` continua igual, mas usa o status derivado.

### 2. RLS — verificar acesso de admin a todos os profiles

O painel só funciona se o admin (`blindadoemotivado@gmail.com`) puder fazer SELECT em **todos** os perfis (não só o dele) e UPDATE em qualquer perfil. Hoje a política provável é "user pode ler/editar só o próprio".

Vou precisar gerar SQL para adicionar políticas RLS para o admin. Como o projeto usa convenção de exibir SQL no chat para você rodar manualmente (memória do projeto), vou:

1. Criar/atualizar arquivo `SUPABASE_ADMIN_PROFILES_ACCESS.sql` na raiz com:

```sql
-- Função helper para checar se o usuário logado é o admin do FCIA
CREATE OR REPLACE FUNCTION public.is_fcia_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) = 'blindadoemotivado@gmail.com'
  );
$$;

-- Política de SELECT para admin ver todos os perfis
DROP POLICY IF EXISTS "FCIA admin can view all profiles" ON public.profiles;
CREATE POLICY "FCIA admin can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_fcia_admin());

-- Política de UPDATE para admin editar qualquer perfil
DROP POLICY IF EXISTS "FCIA admin can update all profiles" ON public.profiles;
CREATE POLICY "FCIA admin can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_fcia_admin())
  WITH CHECK (public.is_fcia_admin());
```

2. Mostrar esse SQL no chat para você copiar e rodar no Supabase SQL Editor.

### 3. Não mexer em `subscriptions`

Deixamos a tabela como está (vazia). Não é deletada nem usada pelo painel. Se um dia quiser usar, o código atual fica como referência.

## O que muda visualmente

- Painel passa a listar **todos os usuários cadastrados** (donos com `role='admin'`), incluindo você.
- Cada cliente mostra: nome do negócio, email, badge de status (Ativo/Trial/Expirado/Inativo) e data de expiração.
- Botões "Definir plano" e "Ativar/Desativar" continuam funcionando, mas escrevem em `profiles`.

## Ação manual necessária após implementação

Rodar o SQL `SUPABASE_ADMIN_PROFILES_ACCESS.sql` no Supabase SQL Editor para liberar o acesso do admin a todos os perfis. Vou exibir o SQL no chat após implementar.

## Arquivos afetados

- ✏️ `src/pages/Admin.tsx` (refatoração principal)
- ➕ `SUPABASE_ADMIN_PROFILES_ACCESS.sql` (novo, na raiz)
