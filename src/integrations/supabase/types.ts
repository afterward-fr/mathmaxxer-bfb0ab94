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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      game_sessions: {
        Row: {
          completed_at: string | null
          difficulty: string
          id: string
          is_completed: boolean
          score: number
          started_at: string
          time_control: string
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          difficulty: string
          id?: string
          is_completed?: boolean
          score?: number
          started_at?: string
          time_control: string
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          difficulty?: string
          id?: string
          is_completed?: boolean
          score?: number
          started_at?: string
          time_control?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      match_answers: {
        Row: {
          answered_at: string
          id: string
          is_correct: boolean
          match_id: string
          question_id: string
          user_answer: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          is_correct: boolean
          match_id: string
          question_id: string
          user_answer: string
          user_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          match_id?: string
          question_id?: string
          user_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_answers_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          completed_at: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id: string
          player1_id: string
          player1_score: number
          player2_id: string | null
          player2_score: number
          status: string
          time_control: Database["public"]["Enums"]["time_control_type"]
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          player1_id: string
          player1_score?: number
          player2_id?: string | null
          player2_score?: number
          status?: string
          time_control: Database["public"]["Enums"]["time_control_type"]
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          player1_id?: string
          player1_score?: number
          player2_id?: string | null
          player2_score?: number
          status?: string
          time_control?: Database["public"]["Enums"]["time_control_type"]
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          iq_rating: number
          losses: number
          total_games: number
          updated_at: string
          username: string
          wins: number
        }
        Insert: {
          created_at?: string
          id: string
          iq_rating?: number
          losses?: number
          total_games?: number
          updated_at?: string
          username: string
          wins?: number
        }
        Update: {
          created_at?: string
          id?: string
          iq_rating?: number
          losses?: number
          total_games?: number
          updated_at?: string
          username?: string
          wins?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: string
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id: string
          question: string
        }
        Insert: {
          answer: string
          created_at?: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          question: string
        }
        Update: {
          answer?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          question?: string
        }
        Relationships: []
      }
    }
    Views: {
      questions_public: {
        Row: {
          created_at: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          id: string | null
          question: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string | null
          question?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string | null
          question?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      complete_game: { Args: { p_session_id: string }; Returns: Json }
      verify_answer: {
        Args: { question_id: string; user_answer: string }
        Returns: boolean
      }
    }
    Enums: {
      difficulty_level:
        | "beginner"
        | "elementary"
        | "intermediate"
        | "advanced"
        | "expert"
        | "master"
      time_control_type: "3+2" | "5+5" | "10+10" | "15+15" | "30+30"
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
      difficulty_level: [
        "beginner",
        "elementary",
        "intermediate",
        "advanced",
        "expert",
        "master",
      ],
      time_control_type: ["3+2", "5+5", "10+10", "15+15", "30+30"],
    },
  },
} as const
