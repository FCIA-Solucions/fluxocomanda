// FluxoComanda — Tipos manuais do banco (Supabase externo via hardcode).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; name: string | null; email: string | null; created_at: string };
        Insert: { id: string; name?: string | null; email?: string | null; created_at?: string };
        Update: { id?: string; name?: string | null; email?: string | null; created_at?: string };
      };
      products: {
        Row: { id: string; user_id: string; name: string; price: number; cost: number | null; active: boolean; created_at: string };
        Insert: { id?: string; user_id: string; name: string; price: number; cost?: number | null; active?: boolean; created_at?: string };
        Update: { id?: string; user_id?: string; name?: string; price?: number; cost?: number | null; active?: boolean; created_at?: string };
      };
      orders: {
        Row: { id: string; user_id: string; customer_name: string | null; status: string; total: number; payment_method: string | null; created_at: string; closed_at: string | null };
        Insert: { id?: string; user_id: string; customer_name?: string | null; status?: string; total?: number; payment_method?: string | null; created_at?: string; closed_at?: string | null };
        Update: { id?: string; user_id?: string; customer_name?: string | null; status?: string; total?: number; payment_method?: string | null; created_at?: string; closed_at?: string | null };
      };
      order_items: {
        Row: { id: string; order_id: string; product_id: string | null; product_name: string; quantity: number; unit_price: number; subtotal: number };
        Insert: { id?: string; order_id: string; product_id?: string | null; product_name: string; quantity: number; unit_price: number; subtotal: number };
        Update: { id?: string; order_id?: string; product_id?: string | null; product_name?: string; quantity?: number; unit_price?: number; subtotal?: number };
      };
      sales: {
        Row: { id: string; user_id: string; order_id: string | null; total: number; payment_method: string | null; created_at: string };
        Insert: { id?: string; user_id: string; order_id?: string | null; total: number; payment_method?: string | null; created_at?: string };
        Update: { id?: string; user_id?: string; order_id?: string | null; total?: number; payment_method?: string | null; created_at?: string };
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: never };
    CompositeTypes: { [key: string]: never };
  };
}

