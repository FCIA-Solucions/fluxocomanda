// FluxoComanda — Tipos manuais do banco (Supabase externo via hardcode).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; name: string | null; email: string | null; business_name: string | null; logo_url: string | null; brand_color: string; subscription_status: string; subscription_expires_at: string | null; trial_ends_at: string | null; created_at: string; role: "admin" | "garcom"; owner_id: string | null };
        Insert: { id: string; name?: string | null; email?: string | null; business_name?: string | null; logo_url?: string | null; brand_color?: string; subscription_status?: string; subscription_expires_at?: string | null; trial_ends_at?: string | null; created_at?: string; role?: "admin" | "garcom"; owner_id?: string | null };
        Update: { id?: string; name?: string | null; email?: string | null; business_name?: string | null; logo_url?: string | null; brand_color?: string; subscription_status?: string; subscription_expires_at?: string | null; trial_ends_at?: string | null; created_at?: string; role?: "admin" | "garcom"; owner_id?: string | null };
        Relationships: [];
      };
      products: {
        Row: { id: string; user_id: string; name: string; price: number; cost: number | null; active: boolean; created_at: string; categoria: string | null };
        Insert: { id?: string; user_id: string; name: string; price: number; cost?: number | null; active?: boolean; created_at?: string; categoria?: string | null };
        Update: { id?: string; user_id?: string; name?: string; price?: number; cost?: number | null; active?: boolean; created_at?: string; categoria?: string | null };
        Relationships: [];
      };
      orders: {
        Row: { id: string; user_id: string; customer_name: string | null; customer_id: string | null; status: string; total: number; payment_method: string | null; created_at: string; closed_at: string | null; guardada_em: string | null; guardada_obs: string | null };
        Insert: { id?: string; user_id: string; customer_name?: string | null; customer_id?: string | null; status?: string; total?: number; payment_method?: string | null; created_at?: string; closed_at?: string | null; guardada_em?: string | null; guardada_obs?: string | null };
        Update: { id?: string; user_id?: string; customer_name?: string | null; customer_id?: string | null; status?: string; total?: number; payment_method?: string | null; created_at?: string; closed_at?: string | null; guardada_em?: string | null; guardada_obs?: string | null };
        Relationships: [];
      };
      customers: {
        Row: { id: string; user_id: string; nome: string; apelido: string | null; whatsapp: string | null; created_at: string };
        Insert: { id?: string; user_id: string; nome: string; apelido?: string | null; whatsapp?: string | null; created_at?: string };
        Update: { id?: string; user_id?: string; nome?: string; apelido?: string | null; whatsapp?: string | null; created_at?: string };
        Relationships: [];
      };
      order_items: {
        Row: { id: string; order_id: string; product_id: string | null; product_name: string; quantity: number; unit_price: number; subtotal: number };
        Insert: { id?: string; order_id: string; product_id?: string | null; product_name: string; quantity: number; unit_price: number; subtotal: number };
        Update: { id?: string; order_id?: string; product_id?: string | null; product_name?: string; quantity?: number; unit_price?: number; subtotal?: number };
        Relationships: [];
      };
      sales: {
        Row: { id: string; user_id: string; order_id: string | null; total: number; payment_method: string | null; created_at: string };
        Insert: { id?: string; user_id: string; order_id?: string | null; total: number; payment_method?: string | null; created_at?: string };
        Update: { id?: string; user_id?: string; order_id?: string | null; total?: number; payment_method?: string | null; created_at?: string };
        Relationships: [];
      };
      cash_closures: {
        Row: { id: string; user_id: string; closed_at: string; business_day: string; type: "manual" | "auto"; closed_by_name: string | null; total: number; total_dinheiro: number; total_pix: number; total_cartao: number; sales_count: number; created_at: string };
        Insert: { id?: string; user_id: string; closed_at?: string; business_day: string; type: "manual" | "auto"; closed_by_name?: string | null; total?: number; total_dinheiro?: number; total_pix?: number; total_cartao?: number; sales_count?: number; created_at?: string };
        Update: { id?: string; user_id?: string; closed_at?: string; business_day?: string; type?: "manual" | "auto"; closed_by_name?: string | null; total?: number; total_dinheiro?: number; total_pix?: number; total_cartao?: number; sales_count?: number; created_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
