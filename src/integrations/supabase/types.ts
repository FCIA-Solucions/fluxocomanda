export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      cash_closures: {
        Row: {
          business_day: string
          closed_at: string
          closed_by_name: string | null
          created_at: string
          id: string
          sales_count: number
          total: number
          total_cartao: number
          total_dinheiro: number
          total_pix: number
          type: string
          user_id: string
        }
        Insert: {
          business_day: string
          closed_at?: string
          closed_by_name?: string | null
          created_at?: string
          id?: string
          sales_count?: number
          total?: number
          total_cartao?: number
          total_dinheiro?: number
          total_pix?: number
          type: string
          user_id: string
        }
        Update: {
          business_day?: string
          closed_at?: string
          closed_by_name?: string | null
          created_at?: string
          id?: string
          sales_count?: number
          total?: number
          total_cartao?: number
          total_dinheiro?: number
          total_pix?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          apelido: string | null
          created_at: string
          id: string
          nome: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          apelido?: string | null
          created_at?: string
          id?: string
          nome: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          apelido?: string | null
          created_at?: string
          id?: string
          nome?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          closed_at: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          guardada_em: string | null
          guardada_obs: string | null
          id: string
          payment_method: string | null
          status: string
          total: number
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          guardada_em?: string | null
          guardada_obs?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          total?: number
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          guardada_em?: string | null
          guardada_obs?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          categoria: string
          cost: number | null
          created_at: string
          id: string
          name: string
          price: number
          user_id: string
        }
        Insert: {
          active?: boolean
          categoria?: string
          cost?: number | null
          created_at?: string
          id?: string
          name: string
          price: number
          user_id: string
        }
        Update: {
          active?: boolean
          categoria?: string
          cost?: number | null
          created_at?: string
          id?: string
          name?: string
          price?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          brand_color: string
          business_name: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string | null
          owner_id: string | null
          role: string | null
          subscription_expires_at: string | null
          subscription_status: string
          trial_ends_at: string
        }
        Insert: {
          brand_color?: string
          business_name?: string | null
          created_at?: string
          email?: string | null
          id: string
          logo_url?: string | null
          name?: string | null
          owner_id?: string | null
          role?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string
          trial_ends_at?: string
        }
        Update: {
          brand_color?: string
          business_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string | null
          owner_id?: string | null
          role?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string
          trial_ends_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          payment_method: string | null
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          payment_method?: string | null
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          payment_method?: string | null
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fechar_comanda: {
        Args: { p_order_id: string; p_payment_method: string }
        Returns: Json
      }
      is_fcia_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
