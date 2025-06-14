export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          context_data: Json | null
          conversation_id: string
          created_at: string
          id: string
          message: string
          response: string | null
          user_id: string
        }
        Insert: {
          context_data?: Json | null
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          response?: string | null
          user_id: string
        }
        Update: {
          context_data?: Json | null
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          document_name: string
          document_type: string
          file_name: string | null
          file_url: string | null
          id: string
          is_completed: boolean | null
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          document_name: string
          document_type: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_completed?: boolean | null
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          document_name?: string
          document_type?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_completed?: boolean | null
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_rate_limit: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          first_attempt_at: string
          id: string
          identifier: string
          last_attempt_at: string
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          first_attempt_at?: string
          id?: string
          identifier: string
          last_attempt_at?: string
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          first_attempt_at?: string
          id?: string
          identifier?: string
          last_attempt_at?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          token_hash: string
          used_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          token_hash: string
          used_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          token_hash?: string
          used_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          residence_country: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          residence_country?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          residence_country?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          ai_rating: number | null
          ai_suggestions: string | null
          created_at: string
          file_url: string
          id: string
          parsed_content: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_rating?: number | null
          ai_suggestions?: string | null
          created_at?: string
          file_url: string
          id?: string
          parsed_content?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_rating?: number | null
          ai_suggestions?: string | null
          created_at?: string
          file_url?: string
          id?: string
          parsed_content?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sop_documents: {
        Row: {
          country: string | null
          created_at: string
          document_type: string
          generated_text: string
          id: string
          prompt_input: string
          university: string | null
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          document_type: string
          generated_text: string
          id?: string
          prompt_input: string
          university?: string | null
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          document_type?: string
          generated_text?: string
          id?: string
          prompt_input?: string
          university?: string | null
          user_id?: string
        }
        Relationships: []
      }
      visa_progress: {
        Row: {
          created_at: string
          degree_transcript_verified: boolean | null
          financial_documents_ready: boolean | null
          id: string
          ielts_submitted: boolean | null
          medical_check_done: boolean | null
          passport_ready: boolean | null
          photos_submitted: boolean | null
          police_clearance_obtained: boolean | null
          sop_completed: boolean | null
          university_offer_letter: boolean | null
          updated_at: string
          user_id: string
          visa_form_filled: boolean | null
          visa_interview_scheduled: boolean | null
        }
        Insert: {
          created_at?: string
          degree_transcript_verified?: boolean | null
          financial_documents_ready?: boolean | null
          id?: string
          ielts_submitted?: boolean | null
          medical_check_done?: boolean | null
          passport_ready?: boolean | null
          photos_submitted?: boolean | null
          police_clearance_obtained?: boolean | null
          sop_completed?: boolean | null
          university_offer_letter?: boolean | null
          updated_at?: string
          user_id: string
          visa_form_filled?: boolean | null
          visa_interview_scheduled?: boolean | null
        }
        Update: {
          created_at?: string
          degree_transcript_verified?: boolean | null
          financial_documents_ready?: boolean | null
          id?: string
          ielts_submitted?: boolean | null
          medical_check_done?: boolean | null
          passport_ready?: boolean | null
          photos_submitted?: boolean | null
          police_clearance_obtained?: boolean | null
          sop_completed?: boolean | null
          university_offer_letter?: boolean | null
          updated_at?: string
          user_id?: string
          visa_form_filled?: boolean | null
          visa_interview_scheduled?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_reset_rate_limit: {
        Args: {
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_reset_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_user_by_email: {
        Args: { p_email: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
