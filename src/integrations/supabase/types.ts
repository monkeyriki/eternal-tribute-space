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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banned_users: {
        Row: {
          banned_at: string
          banned_by: string | null
          email: string | null
          id: string
          ip_address: string | null
          reason: string | null
        }
        Insert: {
          banned_at?: string
          banned_by?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
        }
        Update: {
          banned_at?: string
          banned_by?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      memorial_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          memorial_id: string
          sort_order: number
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          memorial_id: string
          sort_order?: number
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          memorial_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorial_images_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      memorial_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          memorial_id: string
          reason: string
          reporter_ip: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          memorial_id: string
          reason: string
          reporter_ip?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          memorial_id?: string
          reason?: string
          reporter_ip?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_memorial_reports_memorial"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      memorial_views: {
        Row: {
          created_at: string
          id: string
          memorial_id: string
          viewer_ip: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          memorial_id: string
          viewer_ip?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          memorial_id?: string
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memorial_views_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      memorials: {
        Row: {
          bio: string | null
          birth_date: string | null
          created_at: string
          death_date: string | null
          first_name: string
          id: string
          image_url: string | null
          is_draft: boolean
          last_name: string
          location: string | null
          password_hash: string | null
          plan: string
          require_tribute_approval: boolean
          tags: string[] | null
          type: string
          updated_at: string
          user_id: string
          video_url: string | null
          visibility: string
        }
        Insert: {
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          death_date?: string | null
          first_name: string
          id?: string
          image_url?: string | null
          is_draft?: boolean
          last_name?: string
          location?: string | null
          password_hash?: string | null
          plan?: string
          require_tribute_approval?: boolean
          tags?: string[] | null
          type?: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          visibility?: string
        }
        Update: {
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          death_date?: string | null
          first_name?: string
          id?: string
          image_url?: string | null
          is_draft?: boolean
          last_name?: string
          location?: string | null
          password_hash?: string | null
          plan?: string
          require_tribute_approval?: boolean
          tags?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          visibility?: string
        }
        Relationships: []
      }
      profanity_words: {
        Row: {
          created_at: string
          id: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          word?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          plan: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          plan?: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      store_items: {
        Row: {
          category: string
          created_at: string
          emoji: string | null
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          tier: string
          type: string
        }
        Insert: {
          category?: string
          created_at?: string
          emoji?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          tier?: string
          type?: string
        }
        Update: {
          category?: string
          created_at?: string
          emoji?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          tier?: string
          type?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          memorial_id: string | null
          metadata: Json | null
          stripe_session_id: string | null
          tribute_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          memorial_id?: string | null
          metadata?: Json | null
          stripe_session_id?: string | null
          tribute_id?: string | null
          type?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          memorial_id?: string | null
          metadata?: Json | null
          stripe_session_id?: string | null
          tribute_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tribute_id_fkey"
            columns: ["tribute_id"]
            isOneToOne: false
            referencedRelation: "tributes"
            referencedColumns: ["id"]
          },
        ]
      }
      tributes: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_paid: boolean
          item_type: string | null
          memorial_id: string
          message: string
          sender_email: string | null
          sender_name: string
          status: string
          stripe_session_id: string | null
          tier: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_paid?: boolean
          item_type?: string | null
          memorial_id: string
          message: string
          sender_email?: string | null
          sender_name?: string
          status?: string
          stripe_session_id?: string | null
          tier?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_paid?: boolean
          item_type?: string | null
          memorial_id?: string
          message?: string
          sender_email?: string | null
          sender_name?: string
          status?: string
          stripe_session_id?: string | null
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tributes_memorial"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_approve_tribute: {
        Args: { tribute_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_memorial_owner: {
        Args: { _memorial_id: string; _user_id: string }
        Returns: boolean
      }
      verify_memorial_password: {
        Args: { _attempt: string; _memorial_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "registered" | "b2b_partner"
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
      app_role: ["admin", "moderator", "user", "registered", "b2b_partner"],
    },
  },
} as const
