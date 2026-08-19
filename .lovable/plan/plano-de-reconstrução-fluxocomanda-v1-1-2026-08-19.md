# Plano de Reconstrução: FluxoComanda v1.1

Use este plano como especificação oficial para reconstruir o backend do FluxoComanda v1.1 no novo Supabase conectado.

## Objetivo
Recriar somente o sistema vazio e funcional. Não importar dados, usuários, arquivos ou vídeos antigos.

## Antes de executar
1. Analise o código atual do projeto.
2. Verifique quais tabelas, colunas, funções RPC, triggers, buckets e policies já estão referenciados pelo frontend.
3. Compare essas referências com o plano abaixo.
4. Não duplique objetos já existentes.
5. Informe qualquer divergência antes de aplicar alterações.

## Reconstrução em Fases

### FASE 1 — Banco de Dados
Tabelas a serem criadas/validadas:
- **profiles**: id (PK auth.users), name, email, business_name, logo_url, brand_color (default #22c55e), role (admin, garcom, superadmin), subscription_status, subscription_expires_at, trial_ends_at, created_at.
- **products**: id (PK), user_id, business_id, name, price, categoria (bebidas, comidas, outros), active, created_at.
- **customers**: id (PK), user_id, business_id, nome, apelido, whatsapp, created_at.
- **orders**: id (PK), user_id, business_id, customer_id, customer_name, customer_phone, status (open, closed, guardada), total, payment_method, created_at, closed_at, guardada_em, guardada_obs.
- **order_items**: id (PK), order_id, product_id, product_name, quantity, unit_price, subtotal.
- **sales**: id (PK), user_id, business_id, order_id, total, payment_method, created_at.
- **cash_closures**: id (PK), user_id, business_id, closed_at, business_day, total, sales_count.

### FASE 2 — Relacionamentos
- `profiles.id` -> `auth.users.id`
- `products`, `customers`, `orders`, `sales` -> possuem `user_id` e `business_id` para isolamento.
- `orders.customer_id` -> `customers.id`
- `order_items.order_id` -> `orders.id`
- `order_items.product_id` -> `products.id`
- `sales.order_id` -> `orders.id`

### FASE 3 — Segurança (RLS)
- Ative RLS em todas as tabelas.
- Use `business_id` para isolamento entre negócios.
- Admin acessa apenas dados do próprio negócio.
- Garçom opera comandas conforme permissões do sistema.
- Superadmin acessa o painel `/admin`.
- **Proibido**: Acesso entre businesses ou uso de `service_role` no frontend.

### FASE 4 — Automação
- Trigger `handle_new_user`: Cria profile automaticamente com trial de 7 dias.
- Role `superadmin` preservada para a conta administrativa configurada no código.
- Sem criação manual de usuários.

### FASE 5 — RPC `fechar_comanda(p_order_id, p_payment_method)`
Lógica obrigatória:
- Validar `auth.uid()`.
- Localizar comanda do `business_id` do usuário.
- `SELECT ... FOR UPDATE` para lock.
- Impedir fechamento duplicado.
- Calcular total via `order_items`.
- Criar registro em `sales`.
- Atualizar `orders`: `status = 'closed'`, `payment_method`, `total`, `closed_at`.
- Execução atômica com rollback total em falha.

### FASE 6 — Storage
- Bucket `logos`: Público para leitura, upload restrito à pasta do `auth.uid()`.
- Sem arquivos de exemplo.

### FASE 7 — Aplicação
- Conectar frontend ao novo Supabase (URLs e chaves).
- Manter: Login, reset senha, onboarding, cardápio, comandas, dashboard, relatórios, assinaturas, painel admin, PWA e manual.
- Manter: Status (open, closed, guardada), formas de pagamento, comprovante WhatsApp e exportação PDF.
- **Proibido**: Criar ou renderizar vídeos.

### FASE 8 — Testes (Fluxo Completo)
- Cadastro -> Onboarding -> Produto -> Comanda -> Pagamento (PIX/Cartão/Dinheiro) -> Dashboard -> Relatório -> Logo.

## Arquivos SQL de Referência
1. `SUPABASE_SETUP.sql`
2. `SUPABASE_RPC_FECHAR_COMANDA.sql`
3. `SUPABASE_MIGRATION_SUBSCRIPTION.sql`
4. `SUPABASE_CUSTOMERS_INTEGRATION.sql`
5. `SUPABASE_CASH_CLOSURES.sql`
6. `SUPABASE_ADD_PRODUCTS_CATEGORIA.sql`
7. `SUPABASE_MULTI_ADMIN.sql`
8. `SUPABASE_FIX_PROFILES_AND_LOGOS.sql`
9. `SUPABASE_FIX_NEW_ACCOUNTS.sql`
10. `SUPABASE_ADMIN_PROFILES_ACCESS.sql`
