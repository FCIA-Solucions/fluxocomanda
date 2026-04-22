// FluxoComanda — Tipos manuais do banco (Supabase externo via hardcode).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; name: string | null; email: string | null; business_name: string | null; logo_url: string | null; brand_color: string; created_at: string };
        Insert: { id: string; name?: string | null; email?: string | null; business_name?: string | null; logo_url?: string | null; brand_color?: string; created_at?: string };
        Update: { id?: string; name?: string | null; email?: string | null; business_name?: string | null; logo_url?: string | null; brand_color?: string; created_at?: string };
        Relationships: [];
      };
      products: {
        Row: { id: string; user_id: string; name: string; price: number; cost: number | null; active: boolean; created_at: string };
        Insert: { id?: string; user_id: string; name: string; price: number; cost?: number | null; active?: boolean; created_at?: string };
        Update: { id?: string; user_id?: string; name?: string; price?: number; cost?: number | null; active?: boolean; created_at?: string };
        Relationships: [];
      };
      orders: {
        Row: { id: string; user_id: string; customer_name: string | null; status: string; total: number; payment_method: string | null; created_at: string; closed_at: string | null };
        Insert: { id?: string; user_id: string; customer_name?: string | null; status?: string; total?: number; payment_method?: string | null; created_at?: string; closed_at?: string | null };
        Update: { id?: string; user_id?: string; customer_name?: string | null; status?: string; total?: number; payment_method?: string | null; created_at?: string; closed_at?: string | null };
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
