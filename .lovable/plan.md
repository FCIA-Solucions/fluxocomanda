# Plano de Reconstrução: FluxoComanda v1.1

O objetivo é recriar o backend do FluxoComanda em um novo projeto Supabase, garantindo isolamento multi-tenant (`business_id`) e todas as funcionalidades da versão 1.1 documentada.

## 🏗️ Estrutura do Banco de Dados (PostgreSQL)

### Tabelas a serem criadas/validadas:

1.  **`profiles`**:
    *   `id`: UUID (PK, auth.users)
    *   `name`: TEXT
    *   `email`: TEXT
    *   `business_name`: TEXT
    *   `logo_url`: TEXT
    *   `brand_color`: TEXT (default #22c55e)
    *   `role`: TEXT (admin, garcom, superadmin)
    *   `subscription_status`: TEXT (trial, active, expired, vitalicio)
    *   `subscription_expires_at`: TIMESTAMPTZ
    *   `trial_ends_at`: TIMESTAMPTZ
    *   `created_at`: TIMESTAMPTZ

2.  **`products`**:
    *   `id`: UUID (PK)
    *   `user_id`: UUID (FK auth.users - dono do negócio)
    *   `business_id`: UUID (Isolamento)
    *   `name`: TEXT
    *   `price`: NUMERIC
    *   `categoria`: TEXT (bebidas, comidas, outros)
    *   `active`: BOOLEAN
    *   `created_at`: TIMESTAMPTZ

3.  **`customers`**:
    *   `id`: UUID (PK)
    *   `user_id`: UUID (FK auth.users)
    *   `business_id`: UUID
    *   `nome`: TEXT
    *   `apelido`: TEXT
    *   `whatsapp`: TEXT
    *   `created_at`: TIMESTAMPTZ

4.  **`orders`** (Comandas):
    *   `id`: UUID (PK)
    *   `user_id`: UUID
    *   `business_id`: UUID
    *   `customer_id`: UUID (FK customers)
    *   `customer_name`: TEXT (fallback)
    *   `customer_phone`: TEXT (para comprovante WhatsApp)
    *   `status`: TEXT (open, closed, guardada)
    *   `total`: NUMERIC
    *   `payment_method`: TEXT (dinheiro, pix, cartao)
    *   `created_at`: TIMESTAMPTZ
    *   `closed_at`: TIMESTAMPTZ
    *   `guardada_em`: TIMESTAMPTZ
    *   `guardada_obs`: TEXT

5.  **`order_items`**:
    *   `id`: UUID (PK)
    *   `order_id`: UUID (FK orders)
    *   `product_id`: UUID (FK products)
    *   `product_name`: TEXT
    *   `quantity`: INTEGER
    *   `unit_price`: NUMERIC
    *   `subtotal`: NUMERIC

6.  **`sales`**:
    *   `id`: UUID (PK)
    *   `user_id`: UUID
    *   `business_id`: UUID
    *   `order_id`: UUID (FK orders)
    *   `total`: NUMERIC
    *   `payment_method`: TEXT
    *   `created_at`: TIMESTAMPTZ

7.  **`cash_closures`**:
    *   `id`: UUID (PK)
    *   `user_id`: UUID
    *   `business_id`: UUID
    *   `closed_at`: TIMESTAMPTZ
    *   `business_day`: DATE
    *   `total`: NUMERIC
    *   `sales_count`: INTEGER

## 🔐 Segurança e Lógica

*   **RLS (Row Level Security)**: Habilitado em todas as tabelas. Filtro por `business_id` ou `user_id`.
*   **RPC `fechar_comanda`**: Transação atômica que:
    1.  Valida `auth.uid()`.
    2.  Dá lock `FOR UPDATE` na comanda.
    3.  Calcula total via `order_items`.
    4.  Cria registro em `sales`.
    5.  Atualiza `orders` para `status = 'closed'`.
*   **Triggers**: `handle_new_user` para criar profile automático com 7 dias de trial.
*   **Storage**: Bucket `logos` (público) com RLS para upload apenas na pasta do próprio `auth.uid()`.

## 📂 Arquivos SQL Utilizados
1.  `SUPABASE_SETUP.sql` (Base)
2.  `SUPABASE_RPC_FECHAR_COMANDA.sql` (Lógica de fechamento)
3.  `SUPABASE_MIGRATION_SUBSCRIPTION.sql` (Assinaturas)
4.  `SUPABASE_CUSTOMERS_INTEGRATION.sql` (Clientes)
5.  `SUPABASE_CASH_CLOSURES.sql` (Caixa)
6.  `SUPABASE_ADD_PRODUCTS_CATEGORIA.sql` (Categorias)
7.  `SUPABASE_MULTI_ADMIN.sql` (Superadmin/Roles)
8.  `SUPABASE_FIX_PROFILES_AND_LOGOS.sql` (Storage e campos extras)

---
*O próximo passo será a execução do SQL consolidado no Supabase.*
