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
      fsrs_cards: {
        Row: {
          created_at: string | null
          difficulty: number | null
          due_date: string | null
          id: string
          lapses: number | null
          last_review: string | null
          question_id: string
          reps: number | null
          stability: number | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          difficulty?: number | null
          due_date?: string | null
          id?: string
          lapses?: number | null
          last_review?: string | null
          question_id: string
          reps?: number | null
          stability?: number | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          difficulty?: number | null
          due_date?: string | null
          id?: string
          lapses?: number | null
          last_review?: string | null
          question_id?: string
          reps?: number | null
          stability?: number | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fsrs_cards_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fsrs_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_objectives: {
        Row: {
          content_text: string | null
          created_at: string | null
          description: string | null
          id: string
          last_reviewed: string | null
          mastery_level: number | null
          page_range: string | null
          pdf_id: string
          priority: Database["public"]["Enums"]["priority_level"] | null
          title: string
          total_questions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_reviewed?: string | null
          mastery_level?: number | null
          page_range?: string | null
          pdf_id: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          title: string
          total_questions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_reviewed?: string | null
          mastery_level?: number | null
          page_range?: string | null
          pdf_id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          title?: string
          total_questions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_objectives_pdf_id_fkey"
            columns: ["pdf_id"]
            isOneToOne: false
            referencedRelation: "pdfs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_objectives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdfs: {
        Row: {
          created_at: string | null
          file_path: string
          filename: string
          id: string
          processing_status:
            | Database["public"]["Enums"]["processing_status"]
            | null
          total_learning_objectives: number | null
          upload_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          filename: string
          id?: string
          processing_status?:
            | Database["public"]["Enums"]["processing_status"]
            | null
          total_learning_objectives?: number | null
          upload_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          filename?: string
          id?: string
          processing_status?:
            | Database["public"]["Enums"]["processing_status"]
            | null
          total_learning_objectives?: number | null
          upload_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdfs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          streak_count: number | null
          total_mastery_points: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          streak_count?: number | null
          total_mastery_points?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          streak_count?: number | null
          total_mastery_points?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          explanation: string | null
          id: string
          learning_objective_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          explanation?: string | null
          id?: string
          learning_objective_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          explanation?: string | null
          id?: string
          learning_objective_id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_learning_objective_id_fkey"
            columns: ["learning_objective_id"]
            isOneToOne: false
            referencedRelation: "learning_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      study_attempts: {
        Row: {
          created_at: string | null
          difficulty_rating:
            | Database["public"]["Enums"]["difficulty_level"]
            | null
          id: string
          is_correct: boolean | null
          question_id: string
          response_time: number | null
          selected_answer: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          difficulty_rating?:
            | Database["public"]["Enums"]["difficulty_level"]
            | null
          id?: string
          is_correct?: boolean | null
          question_id: string
          response_time?: number | null
          selected_answer?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          difficulty_rating?:
            | Database["public"]["Enums"]["difficulty_level"]
            | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
          response_time?: number | null
          selected_answer?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          accuracy: number | null
          completed_at: string | null
          correct_answers: number | null
          created_at: string | null
          id: string
          mastery_gained: number | null
          session_type: Database["public"]["Enums"]["session_type"]
          started_at: string | null
          time_spent: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          mastery_gained?: number | null
          session_type: Database["public"]["Enums"]["session_type"]
          started_at?: string | null
          time_spent?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          accuracy?: number | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          mastery_gained?: number | null
          session_type?: Database["public"]["Enums"]["session_type"]
          started_at?: string | null
          time_spent?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
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
      [_ in never]: never
    }
    Enums: {
      difficulty_level: "easy" | "medium" | "hard"
      priority_level: "High" | "Medium" | "Low"
      processing_status: "pending" | "processing" | "completed" | "failed"
      session_type: "study" | "test"
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
    Enums: {
      difficulty_level: ["easy", "medium", "hard"],
      priority_level: ["High", "Medium", "Low"],
      processing_status: ["pending", "processing", "completed", "failed"],
      session_type: ["study", "test"],
    },
  },
} as const
