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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      beneficiaries: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          id: string
          identifier: string
          label: string | null
          provider_code: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          id?: string
          identifier: string
          label?: string | null
          provider_code?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          id?: string
          identifier?: string
          label?: string | null
          provider_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cashback_rules: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          percentage: number
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          percentage?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          percentage?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_plans: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          name: string
          provider_id: string
          validity: string | null
        }
        Insert: {
          active?: boolean
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          provider_id: string
          validity?: string | null
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          provider_id?: string
          validity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["service_category"]
          code: string
          color: string | null
          created_at: string
          id: string
          logo_emoji: string | null
          name: string
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["service_category"]
          code: string
          color?: string | null
          created_at?: string
          id?: string
          logo_emoji?: string | null
          name: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["service_category"]
          code?: string
          color?: string | null
          created_at?: string
          id?: string
          logo_emoji?: string | null
          name?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          cashback: number
          category: Database["public"]["Enums"]["service_category"] | null
          created_at: string
          description: string | null
          fee: number
          id: string
          identifier: string | null
          metadata: Json | null
          provider_code: string | null
          provider_name: string | null
          reference: string
          status: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
        }
        Insert: {
          amount: number
          cashback?: number
          category?: Database["public"]["Enums"]["service_category"] | null
          created_at?: string
          description?: string | null
          fee?: number
          id?: string
          identifier?: string | null
          metadata?: Json | null
          provider_code?: string | null
          provider_name?: string | null
          reference: string
          status?: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
        }
        Update: {
          amount?: number
          cashback?: number
          category?: Database["public"]["Enums"]["service_category"] | null
          created_at?: string
          description?: string | null
          fee?: number
          id?: string
          identifier?: string | null
          metadata?: Json | null
          provider_code?: string | null
          provider_name?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["txn_status"]
          type?: Database["public"]["Enums"]["txn_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          cashback_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          cashback_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          cashback_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fund_wallet: {
        Args: { p_amount: number; p_method?: string }
        Returns: {
          amount: number
          cashback: number
          category: Database["public"]["Enums"]["service_category"] | null
          created_at: string
          description: string | null
          fee: number
          id: string
          identifier: string | null
          metadata: Json | null
          provider_code: string | null
          provider_name: string | null
          reference: string
          status: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      process_bill_payment: {
        Args: {
          p_amount: number
          p_category: Database["public"]["Enums"]["service_category"]
          p_description: string
          p_identifier: string
          p_metadata?: Json
          p_provider_code: string
          p_provider_name: string
        }
        Returns: {
          amount: number
          cashback: number
          category: Database["public"]["Enums"]["service_category"] | null
          created_at: string
          description: string | null
          fee: number
          id: string
          identifier: string | null
          metadata: Json | null
          provider_code: string | null
          provider_name: string | null
          reference: string
          status: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      withdraw_cashback: {
        Args: { p_amount: number }
        Returns: {
          amount: number
          cashback: number
          category: Database["public"]["Enums"]["service_category"] | null
          created_at: string
          description: string | null
          fee: number
          id: string
          identifier: string | null
          metadata: Json | null
          provider_code: string | null
          provider_name: string | null
          reference: string
          status: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      service_category:
        | "airtime"
        | "data"
        | "cable"
        | "electricity"
        | "internet"
        | "recharge_pin"
        | "education"
        | "insurance"
      txn_status: "pending" | "successful" | "failed"
      txn_type:
        | "bill_payment"
        | "wallet_funding"
        | "wallet_transfer"
        | "cashback"
        | "refund"
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
    Enums: {
      service_category: [
        "airtime",
        "data",
        "cable",
        "electricity",
        "internet",
        "recharge_pin",
        "education",
        "insurance",
      ],
      txn_status: ["pending", "successful", "failed"],
      txn_type: [
        "bill_payment",
        "wallet_funding",
        "wallet_transfer",
        "cashback",
        "refund",
      ],
    },
  },
} as const
