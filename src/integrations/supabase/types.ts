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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      order_access_attempts: {
        Row: {
          attempt_scope: string
          failed_attempts: number
          id: number
          locked_until: string | null
          order_id: string | null
          subject_hash: string
          updated_at: string
          window_started_at: string
        }
        Insert: {
          attempt_scope: string
          failed_attempts?: number
          id?: never
          locked_until?: string | null
          order_id?: string | null
          subject_hash: string
          updated_at?: string
          window_started_at?: string
        }
        Update: {
          attempt_scope?: string
          failed_attempts?: number
          id?: never
          locked_until?: string | null
          order_id?: string | null
          subject_hash?: string
          updated_at?: string
          window_started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_access_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_code: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          contact: string
          created_at: string
          deadline: string | null
          description: string
          dp_amount: number | null
          dp_percent: number
          id: string
          is_legacy_order: boolean
          name: string
          notes: string | null
          payment_flow_status: string
          payment_method: string
          payment_note: string | null
          payment_status: string
          pkg: string
          quantity: string | null
          reference: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          service_name: string
          status: string
          total_amount: number | null
          waiting_token_hash: string | null
        }
        Insert: {
          access_code?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact: string
          created_at?: string
          deadline?: string | null
          description: string
          dp_amount?: number | null
          dp_percent?: number
          id?: string
          is_legacy_order?: boolean
          name: string
          notes?: string | null
          payment_flow_status?: string
          payment_method?: string
          payment_note?: string | null
          payment_status?: string
          pkg: string
          quantity?: string | null
          reference?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          service_name: string
          status?: string
          total_amount?: number | null
          waiting_token_hash?: string | null
        }
        Update: {
          access_code?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact?: string
          created_at?: string
          deadline?: string | null
          description?: string
          dp_amount?: number | null
          dp_percent?: number
          id?: string
          is_legacy_order?: boolean
          name?: string
          notes?: string | null
          payment_flow_status?: string
          payment_method?: string
          payment_note?: string | null
          payment_status?: string
          pkg?: string
          quantity?: string | null
          reference?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          service_name?: string
          status?: string
          total_amount?: number | null
          waiting_token_hash?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          dp_percent: number
          id: number
          qris_image_path: string | null
          updated_at: string
        }
        Insert: {
          dp_percent?: number
          id?: number
          qris_image_path?: string | null
          updated_at?: string
        }
        Update: {
          dp_percent?: number
          id?: number
          qris_image_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          available: boolean
          category: string
          created_at: string
          description: string
          discount_price: number | null
          duration: string
          extras: Json
          featured: boolean
          id: string
          image_key: string | null
          name: string
          photo_path: string | null
          price: number
          short: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          category: string
          created_at?: string
          description?: string
          discount_price?: number | null
          duration?: string
          extras?: Json
          featured?: boolean
          id?: string
          image_key?: string | null
          name: string
          photo_path?: string | null
          price?: number
          short?: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          category?: string
          created_at?: string
          description?: string
          discount_price?: number | null
          duration?: string
          extras?: Json
          featured?: boolean
          id?: string
          image_key?: string | null
          name?: string
          photo_path?: string | null
          price?: number
          short?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_order_access_locked: {
        Args: { p_scope: string; p_subject_hash: string }
        Returns: boolean
      }
      record_order_access_failure: {
        Args: { p_order_id?: string; p_scope: string; p_subject_hash: string }
        Returns: string
      }
      reset_order_access_attempts: {
        Args: { p_order_subject_hash: string }
        Returns: undefined
      }
      transition_order_payment_status: {
        Args: {
          p_access_code?: string
          p_actor?: string
          p_expected_status: string
          p_new_status: string
          p_order_id: string
          p_rejection_reason?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
