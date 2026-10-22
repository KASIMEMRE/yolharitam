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
      friendships: {
        Row: {
          addressee: string
          created_at: string
          id: number
          requester: string
          responded_at: string | null
          status: string
        }
        Insert: {
          addressee: string
          created_at?: string
          id?: never
          requester: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          addressee?: string
          created_at?: string
          id?: never
          requester?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_fkey"
            columns: ["addressee"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_fkey"
            columns: ["requester"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_projects: {
        Row: {
          created_at: string
          demo_url: string | null
          description: string
          id: number
          map_id: string
          repo_url: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          demo_url?: string | null
          description?: string
          id?: never
          map_id: string
          repo_url: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          demo_url?: string | null
          description?: string
          id?: never
          map_id?: string
          repo_url?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_reports: {
        Row: {
          created_at: string
          project_id: number
          reason: string | null
          reporter: string
        }
        Insert: {
          created_at?: string
          project_id: number
          reason?: string | null
          reporter?: string
        }
        Update: {
          created_at?: string
          project_id?: number
          reason?: string | null
          reporter?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "showcase_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_reports_reporter_fkey"
            columns: ["reporter"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_items: {
        Row: {
          created_at: string
          id: number
          published_at: string
          source_id: string
          summary: string | null
          summary_tr: string | null
          title: string
          title_tr: string | null
          topic_paths: string[]
          url: string
        }
        Insert: {
          created_at?: string
          id?: never
          published_at: string
          source_id: string
          summary?: string | null
          summary_tr?: string | null
          title: string
          title_tr?: string | null
          topic_paths: string[]
          url: string
        }
        Update: {
          created_at?: string
          id?: never
          published_at?: string
          source_id?: string
          summary?: string | null
          summary_tr?: string | null
          title?: string
          title_tr?: string | null
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
          username: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          username?: string | null
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
      friend_request: {
        Args: { p_username: string }
        Returns: string
      }
      friend_respond: {
        Args: { p_accept: boolean; p_id: number }
        Returns: undefined
      }
      friends_overview: {
        Args: never
        Returns: {
          active_days: string[]
          direction: string
          display_name: string | null
          friendship_id: number
          status: string
          today_done: number
          today_xp: number
          user_id: string
          username: string | null
          week_xp: number
        }[]
      }
      league_week: {
        Args: { p_map: string }
        Returns: {
          display_name: string | null
          is_me: boolean
          rank: number
          user_id: string
          username: string | null
          xp: number
        }[]
      }
      showcase_list: {
        Args: { p_before?: number; p_limit?: number; p_map?: string }
        Returns: {
          created_at: string
          demo_url: string | null
          description: string
          display_name: string | null
          id: number
          is_me: boolean
          map_id: string
          repo_url: string
          title: string
          user_id: string
          username: string | null
        }[]
      }
      username_available: {
        Args: { p: string }
        Returns: boolean
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
