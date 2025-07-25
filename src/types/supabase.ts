export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: number
          phone: string | null
        }
        Insert: {
          address?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: number
          phone?: string | null
        }
        Update: {
          address?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: number
          phone?: string | null
        }
        Relationships: []
      }
      commission_tables: {
        Row: {
          commission_percentage: number
          created_at: string | null
          description: string | null
          id: number
          name: string
          payment_installments: number
        }
        Insert: {
          commission_percentage: number
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          payment_installments: number
        }
        Update: {
          commission_percentage?: number
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          payment_installments?: number
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_id: number
          commission_table_id: number
          contract_code: string
          created_at: string | null
          id: number
          paid_installments: number
          remaining_value: number
          representative_id: string
          status: Database["public"]["Enums"]["contract_status"]
          total_installments: number
          total_value: number
        }
        Insert: {
          client_id: number
          commission_table_id: number
          contract_code: string
          created_at?: string | null
          id?: number
          paid_installments?: number
          remaining_value: number
          representative_id: string
          status?: Database["public"]["Enums"]["contract_status"]
          total_installments?: number
          total_value: number
        }
        Update: {
          client_id?: number
          commission_table_id?: number
          contract_code?: string
          created_at?: string | null
          id?: number
          paid_installments?: number
          remaining_value?: number
          representative_id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          total_installments?: number
          total_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_commission_table_id_fkey"
            columns: ["commission_table_id"]
            isOneToOne: false
            referencedRelation: "commission_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          contract_id: number
          due_date: string
          id: number
          invoice_code: string
          paid_at: string | null
          payment_link_boleto: string | null
          payment_link_pix: string | null
          status: string
          value: number
        }
        Insert: {
          contract_id: number
          due_date: string
          id?: number
          invoice_code: string
          paid_at?: string | null
          payment_link_boleto?: string | null
          payment_link_pix?: string | null
          status?: string
          value: number
        }
        Update: {
          contract_id?: number
          due_date?: string
          id?: number
          invoice_code?: string
          paid_at?: string | null
          payment_link_boleto?: string | null
          payment_link_pix?: string | null
          status?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cnpj: string | null
          commission_code: string | null
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          point_of_sale: string | null
          role: string
          status: Database["public"]["Enums"]["user_status"]
        }
        Insert: {
          cnpj?: string | null
          commission_code?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          point_of_sale?: string | null
          role: string
          status?: Database["public"]["Enums"]["user_status"]
        }
        Update: {
          cnpj?: string | null
          commission_code?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          point_of_sale?: string | null
          role?: string
          status?: Database["public"]["Enums"]["user_status"]
        }
        Relationships: []
      }
      representative_documents: {
        Row: {
          document_type: string
          file_url: string
          id: number
          representative_id: string
          status: Database["public"]["Enums"]["document_status"]
          uploaded_at: string | null
        }
        Insert: {
          document_type: string
          file_url: string
          id?: number
          representative_id: string
          status?: Database["public"]["Enums"]["document_status"]
          uploaded_at?: string | null
        }
        Update: {
          document_type?: string
          file_url?: string
          id?: number
          representative_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "representative_documents_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          id: number
          invoice_url: string
          processed_at: string | null
          rejection_reason: string | null
          representative_id: string
          request_code: string
          requested_at: string | null
          requested_value: number
          status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Insert: {
          id?: number
          invoice_url: string
          processed_at?: string | null
          rejection_reason?: string | null
          representative_id: string
          request_code: string
          requested_at?: string | null
          requested_value: number
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Update: {
          id?: number
          invoice_url?: string
          processed_at?: string | null
          rejection_reason?: string | null
          representative_id?: string
          request_code?: string
          requested_at?: string | null
          requested_value?: number
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_sample_contracts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_sample_invoices: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      contract_status:
        | "Ativo"
        | "Concluído"
        | "Faturado"
        | "Cancelado"
        | "Pendente"
        | "Em Análise"
        | "Em Atraso"
        | "Aprovado"
        | "Reprovado"
      document_status: "Pendente" | "Aprovado" | "Reprovado"
      user_role: "Administrador" | "Suporte"
      user_status:
        | "Ativo"
        | "Inativo"
        | "Pendente de Aprovação"
        | "Documentos Pendentes"
        | "Pausado"
        | "Cancelado"
      withdrawal_status: "Pendente" | "Aprovado" | "Rejeitado"
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
      contract_status: [
        "Ativo",
        "Concluído",
        "Faturado",
        "Cancelado",
        "Pendente",
        "Em Análise",
        "Em Atraso",
        "Aprovado",
        "Reprovado",
      ],
      document_status: ["Pendente", "Aprovado", "Reprovado"],
      user_role: ["Administrador", "Suporte"],
      user_status: [
        "Ativo",
        "Inativo",
        "Pendente de Aprovação",
        "Documentos Pendentes",
        "Pausado",
        "Cancelado",
      ],
      withdrawal_status: ["Pendente", "Aprovado", "Rejeitado"],
    },
  },
} as const
