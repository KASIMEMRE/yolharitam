// Bu dosya Supabase tarafından OTOMATİK üretildi (veritabanı şemasından).
// Elle değiştirme; şema değişince yeniden üretilir.

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
      news_items: {
        Row: {
          created_at: string
          id: number
          published_at: string
          source_id: string
          summary: string | null
          title: string
          topic_paths: string[]
          url: string
        }
        Insert: {
          created_at?: string
          id?: never
          published_at: string
          source_id: string
          summary?: string | null
          title: string
          topic_paths: string[]
          url: string
        }
        Update: {
          created_at?: string
          id?: never
          published_at?: string
          source_id?: string
          summary?: string | null
          title?: string
          topic_paths?: string[]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          created_at: string
          enabled: boolean
          feed_url: string
          id: string
          last_error: string | null
          last_fetched_at: string | null
          name: string
          site_url: string
          topic_paths: string[]
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feed_url: string
          id: string
          last_error?: string | null
          last_fetched_at?: string | null
          name: string
          site_url: string
          topic_paths: string[]
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feed_url?: string
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          name?: string
          site_url?: string
          topic_paths?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      roadmaps: {
        Row: {
          created_at: string
          goal: string | null
          id: string
          learning_style: string | null
          level: string
          personalization: Json | null
          topic_path: string
          updated_at: string
          user_id: string
          weekly_hours: string | null
        }
        Insert: {
          created_at?: string
          goal?: string | null
          id?: string
          learning_style?: string | null
          level: string
          personalization?: Json | null
          topic_path: string
          updated_at?: string
          user_id: string
          weekly_hours?: string | null
        }
        Update: {
          created_at?: string
          goal?: string | null
          id?: string
          learning_style?: string | null
          level?: string
          personalization?: Json | null
          topic_path?: string
          updated_at?: string
          user_id?: string
          weekly_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_steps: {
        Row: {
          created_at: string
          description: string
          estimated_hours: number
          id: string
          phase: string
          position: number
          resource_type: string
          roadmap_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          estimated_hours: number
          id?: string
          phase: string
          position: number
          resource_type: string
          roadmap_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          estimated_hours?: number
          id?: string
          phase?: string
          position?: number
          resource_type?: string
          roadmap_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_steps_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: number
          kind: string
          ref: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: never
          kind: string
          ref: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          kind?: string
          ref?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_progress: {
        Row: {
          roadmap_id: string
          status: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          roadmap_id: string
          status: string
          topic_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          roadmap_id?: string
          status?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_progress_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      step_progress: {
        Row: {
          completed_at: string
          step_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          step_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "roadmap_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_progress_user_id_fkey"
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
      add_steps_to_roadmap: {
        Args: {
          p_goal: string
          p_learning_style: string
          p_roadmap_id: string
          p_steps: Json
          p_weekly_hours: string
        }
        Returns: undefined
      }
      create_roadmap_with_steps: {
        Args: {
          p_goal: string
          p_learning_style: string
          p_level: string
          p_steps: Json
          p_topic_path: string
          p_weekly_hours: string
        }
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
