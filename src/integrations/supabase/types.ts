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
      achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          progress: number
          unlocked: boolean
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          completed: boolean
          completed_at: string | null
          created_at: string
          game_id: string
          id: string
          score: number | null
          user_id: string
        }
        Insert: {
          challenge_date?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          game_id: string
          id?: string
          score?: number | null
          user_id: string
        }
        Update: {
          challenge_date?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          game_id?: string
          id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          avatar_url: string | null
          clinic: string
          created_at: string
          email: string | null
          id: string
          license_number: string | null
          name: string
          specialization: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          clinic?: string
          created_at?: string
          email?: string | null
          id?: string
          license_number?: string | null
          name: string
          specialization?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          clinic?: string
          created_at?: string
          email?: string | null
          id?: string
          license_number?: string | null
          name?: string
          specialization?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_progress: {
        Row: {
          created_at: string
          current_level: number
          game_id: string
          highest_level: number
          id: string
          last_played_at: string
          total_sessions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          game_id: string
          highest_level?: number
          id?: string
          last_played_at?: string
          total_sessions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          game_id?: string
          highest_level?: number
          id?: string
          last_played_at?: string
          total_sessions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          accuracy: number | null
          completed: boolean
          created_at: string
          difficulty: string
          domain: string
          duration: number
          game_id: string
          game_name: string
          id: string
          level: number
          metadata: Json | null
          moves: number | null
          reaction_time: number | null
          score: number
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          completed?: boolean
          created_at?: string
          difficulty?: string
          domain: string
          duration?: number
          game_id: string
          game_name: string
          id?: string
          level?: number
          metadata?: Json | null
          moves?: number | null
          reaction_time?: number | null
          score?: number
          user_id: string
        }
        Update: {
          accuracy?: number | null
          completed?: boolean
          created_at?: string
          difficulty?: string
          domain?: string
          duration?: number
          game_id?: string
          game_name?: string
          id?: string
          level?: number
          metadata?: Json | null
          moves?: number | null
          reaction_time?: number | null
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      patient_alerts: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          message: string
          patient_id: string
          read: boolean
          severity: string
          type: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          message: string
          patient_id: string
          read?: boolean
          severity: string
          type: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          message?: string
          patient_id?: string
          read?: boolean
          severity?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_alerts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_doctor_assignments: {
        Row: {
          condition: string | null
          created_at: string
          doctor_id: string
          enrolled_date: string
          id: string
          notes: string | null
          patient_id: string
          risk_level: string | null
          status: string
          updated_at: string
        }
        Insert: {
          condition?: string | null
          created_at?: string
          doctor_id: string
          enrolled_date?: string
          id?: string
          notes?: string | null
          patient_id: string
          risk_level?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          condition?: string | null
          created_at?: string
          doctor_id?: string
          enrolled_date?: string
          id?: string
          notes?: string | null
          patient_id?: string
          risk_level?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_doctor_assignments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_doctor_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cognitive_age: number | null
          created_at: string
          current_streak: number
          date_of_birth: string | null
          email: string | null
          id: string
          longest_streak: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cognitive_age?: number | null
          created_at?: string
          current_streak?: number
          date_of_birth?: string | null
          email?: string | null
          id?: string
          longest_streak?: number
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cognitive_age?: number | null
          created_at?: string
          current_streak?: number
          date_of_birth?: string | null
          email?: string | null
          id?: string
          longest_streak?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_plan_games: {
        Row: {
          created_at: string
          difficulty: string
          domain: string
          game_id: string
          game_name: string
          id: string
          plan_id: string
          sessions_per_week: number
        }
        Insert: {
          created_at?: string
          difficulty?: string
          domain: string
          game_id: string
          game_name: string
          id?: string
          plan_id: string
          sessions_per_week?: number
        }
        Update: {
          created_at?: string
          difficulty?: string
          domain?: string
          game_id?: string
          game_name?: string
          id?: string
          plan_id?: string
          sessions_per_week?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_plan_games_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          created_at: string
          doctor_id: string
          end_date: string | null
          frequency: string
          id: string
          name: string
          notes: string | null
          patient_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          end_date?: string | null
          frequency?: string
          id?: string
          name: string
          notes?: string | null
          patient_id: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      current_doctor_id: { Args: never; Returns: string }
      find_patient_profile_by_email: {
        Args: { _email: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assigned_patient_profile: {
        Args: { _profile_id: string }
        Returns: boolean
      }
      is_assigned_patient_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "doctor" | "patient"
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
      app_role: ["admin", "doctor", "patient"],
    },
  },
} as const
