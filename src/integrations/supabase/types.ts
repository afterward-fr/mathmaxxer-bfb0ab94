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
      achievements: {
        Row: {
          category: string
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      answer_verification_attempts: {
        Row: {
          attempted_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      claimed_rewards: {
        Row: {
          claimed_at: string
          id: string
          reward_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          reward_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claimed_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "daily_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_invites: {
        Row: {
          clan_id: string
          created_at: string
          id: string
          invited_by: string
          status: string
          user_id: string
        }
        Insert: {
          clan_id: string
          created_at?: string
          id?: string
          invited_by: string
          status?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          created_at?: string
          id?: string
          invited_by?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_invites_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_members: {
        Row: {
          clan_id: string
          contribution_points: number
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          clan_id: string
          contribution_points?: number
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          contribution_points?: number
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          banner_color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_public: boolean
          max_members: number
          member_count: number
          name: string
          owner_id: string
          total_rating: number
          updated_at: string
        }
        Insert: {
          banner_color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_public?: boolean
          max_members?: number
          member_count?: number
          name: string
          owner_id: string
          total_rating?: number
          updated_at?: string
        }
        Update: {
          banner_color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_public?: boolean
          max_members?: number
          member_count?: number
          name?: string
          owner_id?: string
          total_rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          created_at: string
          difficulty: string
          id: string
          reward_iq_rating: number
          reward_practice_rating: number
          target_score: number
          time_control: string
        }
        Insert: {
          challenge_date: string
          created_at?: string
          difficulty: string
          id?: string
          reward_iq_rating?: number
          reward_practice_rating?: number
          target_score: number
          time_control: string
        }
        Update: {
          challenge_date?: string
          created_at?: string
          difficulty?: string
          id?: string
          reward_iq_rating?: number
          reward_practice_rating?: number
          target_score?: number
          time_control?: string
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          created_at: string
          day_number: number
          description: string
          id: string
          reward_type: string
          reward_value: number
        }
        Insert: {
          created_at?: string
          day_number: number
          description: string
          id?: string
          reward_type: string
          reward_value: number
        }
        Update: {
          created_at?: string
          day_number?: number
          description?: string
          id?: string
          reward_type?: string
          reward_value?: number
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_answers: {
        Row: {
          answered_at: string
          game_session_id: string
          id: string
          is_correct: boolean
          question_id: string
          user_answer: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          game_session_id: string
          id?: string
          is_correct: boolean
          question_id: string
          user_answer: string
          user_id: string
        }
        Update: {
          answered_at?: string
          game_session_id?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          user_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_answers_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          challenge_id: string | null
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
          challenge_id?: string | null
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
          challenge_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "game_sessions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
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
      match_messages: {
        Row: {
          created_at: string
          custom_message: string | null
          id: string
          match_id: string
          quick_chat_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_message?: string | null
          id?: string
          match_id: string
          quick_chat_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          custom_message?: string | null
          id?: string
          match_id?: string
          quick_chat_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_messages_quick_chat_id_fkey"
            columns: ["quick_chat_id"]
            isOneToOne: false
            referencedRelation: "quick_chats"
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
      matchmaking_queue: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          iq_rating: number
          time_control: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty: string
          id?: string
          iq_rating: number
          time_control: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          iq_rating?: number
          time_control?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bonus_expires_at: string | null
          bonus_multiplier: number
          created_at: string
          id: string
          iq_rating: number
          losses: number
          practice_rating: number
          total_games: number
          updated_at: string
          username: string
          wins: number
        }
        Insert: {
          avatar_url?: string | null
          bonus_expires_at?: string | null
          bonus_multiplier?: number
          created_at?: string
          id: string
          iq_rating?: number
          losses?: number
          practice_rating?: number
          total_games?: number
          updated_at?: string
          username: string
          wins?: number
        }
        Update: {
          avatar_url?: string | null
          bonus_expires_at?: string | null
          bonus_multiplier?: number
          created_at?: string
          id?: string
          iq_rating?: number
          losses?: number
          practice_rating?: number
          total_games?: number
          updated_at?: string
          username?: string
          wins?: number
        }
        Relationships: []
      }
      question_topics: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
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
          topic_id: string | null
        }
        Insert: {
          answer: string
          created_at?: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          question: string
          topic_id?: string | null
        }
        Update: {
          answer?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          question?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_chats: {
        Row: {
          category: string
          icon: string | null
          id: string
          message: string
          sort_order: number
        }
        Insert: {
          category: string
          icon?: string | null
          id?: string
          message: string
          sort_order?: number
        }
        Update: {
          category?: string
          icon?: string | null
          id?: string
          message?: string
          sort_order?: number
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          max_uses: number | null
          reward_per_referral: number
          user_id: string
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          max_uses?: number | null
          reward_per_referral?: number
          user_id: string
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          max_uses?: number | null
          reward_per_referral?: number
          user_id?: string
          uses?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
          reward_claimed: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
          reward_claimed?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          referral_code_id?: string
          referred_id?: string
          referrer_id?: string
          reward_claimed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          best_time: number | null
          games_played: number
          id: string
          joined_at: string
          score: number
          tournament_id: string
          user_id: string
        }
        Insert: {
          best_time?: number | null
          games_played?: number
          id?: string
          joined_at?: string
          score?: number
          tournament_id: string
          user_id: string
        }
        Update: {
          best_time?: number | null
          games_played?: number
          id?: string
          joined_at?: string
          score?: number
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string
          end_date: string
          entry_fee: number
          id: string
          max_participants: number | null
          name: string
          prize_pool: number
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty: string
          end_date: string
          entry_fee?: number
          id?: string
          max_participants?: number | null
          name: string
          prize_pool?: number
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string
          end_date?: string
          entry_fee?: number
          id?: string
          max_participants?: number | null
          name?: string
          prize_pool?: number
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          average_time_per_question: number | null
          best_streak: number
          correct_answers: number
          created_at: string
          date: string
          difficulty_breakdown: Json | null
          games_played: number
          id: string
          questions_answered: number
          topics_practiced: string[] | null
          user_id: string
        }
        Insert: {
          average_time_per_question?: number | null
          best_streak?: number
          correct_answers?: number
          created_at?: string
          date: string
          difficulty_breakdown?: Json | null
          games_played?: number
          id?: string
          questions_answered?: number
          topics_practiced?: string[] | null
          user_id: string
        }
        Update: {
          average_time_per_question?: number | null
          best_streak?: number
          correct_answers?: number
          created_at?: string
          date?: string
          difficulty_breakdown?: Json | null
          games_played?: number
          id?: string
          questions_answered?: number
          topics_practiced?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      user_challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          score_achieved: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          score_achieved: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          score_achieved?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          freeze_tokens: number
          id: string
          last_login_date: string | null
          longest_streak: number
          streak_frozen_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          freeze_tokens?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          streak_frozen_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          freeze_tokens?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          streak_frozen_until?: string | null
          updated_at?: string
          user_id?: string
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
      complete_daily_challenge_internal: {
        Args: {
          p_challenge_id: string
          p_session_id: string
          p_user_id: string
          p_verified_score: number
        }
        Returns: Json
      }
      complete_game: { Args: { p_session_id: string }; Returns: Json }
      find_match: {
        Args: {
          p_difficulty: string
          p_iq_rating: number
          p_time_control: string
          p_user_id: string
        }
        Returns: string
      }
      get_questions: {
        Args: { p_difficulty: string; p_limit?: number }
        Returns: {
          created_at: string
          difficulty: string
          id: string
          question: string
        }[]
      }
      verify_answer: {
        Args: { p_question_id: string; user_answer: string }
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
