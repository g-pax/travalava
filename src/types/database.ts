export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          category: string | null;
          client_mutation_id: string | null;
          cost_amount: number | null;
          cost_currency: string | null;
          created_at: string;
          duration_min: number | null;
          id: string;
          link: string | null;
          location: Json | null;
          notes: string | null;
          src: string | null;
          title: string;
          trip_id: string;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          client_mutation_id?: string | null;
          cost_amount?: number | null;
          cost_currency?: string | null;
          created_at?: string;
          duration_min?: number | null;
          id?: string;
          link?: string | null;
          location?: Json | null;
          notes?: string | null;
          src?: string | null;
          title: string;
          trip_id: string;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          client_mutation_id?: string | null;
          cost_amount?: number | null;
          cost_currency?: string | null;
          created_at?: string;
          duration_min?: number | null;
          id?: string;
          link?: string | null;
          location?: Json | null;
          notes?: string | null;
          src?: string | null;
          title?: string;
          trip_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_restaurants: {
        Row: {
          activity_id: string;
          created_at: string;
          id: string;
          linked_by: string | null;
          restaurant_id: string;
          sort_order: number;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          id?: string;
          linked_by?: string | null;
          restaurant_id: string;
          sort_order?: number;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          id?: string;
          linked_by?: string | null;
          restaurant_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "activity_restaurants_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_restaurants_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      block_proposals: {
        Row: {
          activity_id: string;
          block_id: string;
          client_mutation_id: string | null;
          created_at: string;
          created_by: string;
          id: string;
          trip_id: string;
          updated_at: string;
        };
        Insert: {
          activity_id: string;
          block_id: string;
          client_mutation_id?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          trip_id: string;
          updated_at?: string;
        };
        Update: {
          activity_id?: string;
          block_id?: string;
          client_mutation_id?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          trip_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "block_proposals_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "block_proposals_block_id_fkey";
            columns: ["block_id"];
            isOneToOne: false;
            referencedRelation: "blocks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "block_proposals_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "trip_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "block_proposals_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      blocks: {
        Row: {
          created_at: string;
          day_id: string;
          id: string;
          label: string;
          position: number;
          updated_at: string;
          vote_close_ts: string | null;
          vote_open_ts: string | null;
        };
        Insert: {
          created_at?: string;
          day_id: string;
          id?: string;
          label: string;
          position: number;
          updated_at?: string;
          vote_close_ts?: string | null;
          vote_open_ts?: string | null;
        };
        Update: {
          created_at?: string;
          day_id?: string;
          id?: string;
          label?: string;
          position?: number;
          updated_at?: string;
          vote_close_ts?: string | null;
          vote_open_ts?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_day_id_fkey";
            columns: ["day_id"];
            isOneToOne: false;
            referencedRelation: "days";
            referencedColumns: ["id"];
          },
        ];
      };
      commits: {
        Row: {
          activity_id: string;
          block_id: string;
          committed_at: string;
          committed_by: string;
          created_at: string;
          id: string;
          trip_id: string;
          updated_at: string;
        };
        Insert: {
          activity_id: string;
          block_id: string;
          committed_at?: string;
          committed_by: string;
          created_at?: string;
          id?: string;
          trip_id: string;
          updated_at?: string;
        };
        Update: {
          activity_id?: string;
          block_id?: string;
          committed_at?: string;
          committed_by?: string;
          created_at?: string;
          id?: string;
          trip_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commits_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commits_block_id_fkey";
            columns: ["block_id"];
            isOneToOne: true;
            referencedRelation: "blocks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commits_committed_by_fkey";
            columns: ["committed_by"];
            isOneToOne: false;
            referencedRelation: "trip_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commits_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      days: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          trip_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          trip_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          trip_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "days_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback: {
        Row: {
          app_version: string | null;
          breadcrumbs: Json | null;
          created_at: string;
          env: string | null;
          feature_flags: Json | null;
          git_sha: string | null;
          id: string;
          ip_hash: string | null;
          locale: string | null;
          message: string;
          route: string | null;
          screenshot_path: string | null;
          severity: string | null;
          timezone: string | null;
          type: string;
          url: string | null;
          user_agent: string | null;
          user_id: string | null;
          viewport: Json | null;
        };
        Insert: {
          app_version?: string | null;
          breadcrumbs?: Json | null;
          created_at?: string;
          env?: string | null;
          feature_flags?: Json | null;
          git_sha?: string | null;
          id?: string;
          ip_hash?: string | null;
          locale?: string | null;
          message: string;
          route?: string | null;
          screenshot_path?: string | null;
          severity?: string | null;
          timezone?: string | null;
          type: string;
          url?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          viewport?: Json | null;
        };
        Update: {
          app_version?: string | null;
          breadcrumbs?: Json | null;
          created_at?: string;
          env?: string | null;
          feature_flags?: Json | null;
          git_sha?: string | null;
          id?: string;
          ip_hash?: string | null;
          locale?: string | null;
          message?: string;
          route?: string | null;
          screenshot_path?: string | null;
          severity?: string | null;
          timezone?: string | null;
          type?: string;
          url?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          viewport?: Json | null;
        };
        Relationships: [];
      };
      restaurants: {
        Row: {
          address: string | null;
          created_at: string;
          created_by: string | null;
          cuisine_type: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          lat: number | null;
          location_updated_at: string | null;
          lon: number | null;
          name: string;
          phone: string | null;
          place_id: string | null;
          price_range: string | null;
          rating: number | null;
          review_count: number | null;
          trip_id: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          cuisine_type?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          lat?: number | null;
          location_updated_at?: string | null;
          lon?: number | null;
          name: string;
          phone?: string | null;
          place_id?: string | null;
          price_range?: string | null;
          rating?: number | null;
          review_count?: number | null;
          trip_id: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          cuisine_type?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          lat?: number | null;
          location_updated_at?: string | null;
          lon?: number | null;
          name?: string;
          phone?: string | null;
          place_id?: string | null;
          price_range?: string | null;
          rating?: number | null;
          review_count?: number | null;
          trip_id?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "restaurants_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_members: {
        Row: {
          client_mutation_id: string | null;
          created_at: string;
          display_name: string;
          id: string;
          joined_at: string;
          role: string;
          trip_id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          client_mutation_id?: string | null;
          created_at?: string;
          display_name: string;
          id?: string;
          joined_at?: string;
          role: string;
          trip_id: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          client_mutation_id?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          joined_at?: string;
          role?: string;
          trip_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      trips: {
        Row: {
          client_mutation_id: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          destination_text: string;
          duplicate_policy: string;
          end_date: string;
          id: string;
          invite_token_version: number;
          lat: number | null;
          lon: number | null;
          name: string;
          pin_hash: string | null;
          share_enabled: boolean;
          share_token_version: number;
          start_date: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          client_mutation_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          destination_text: string;
          duplicate_policy?: string;
          end_date: string;
          id?: string;
          invite_token_version?: number;
          lat?: number | null;
          lon?: number | null;
          name: string;
          pin_hash?: string | null;
          share_enabled?: boolean;
          share_token_version?: number;
          start_date: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          client_mutation_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          destination_text?: string;
          duplicate_policy?: string;
          end_date?: string;
          id?: string;
          invite_token_version?: number;
          lat?: number | null;
          lon?: number | null;
          name?: string;
          pin_hash?: string | null;
          share_enabled?: boolean;
          share_token_version?: number;
          start_date?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          activity_id: string;
          block_id: string;
          client_mutation_id: string | null;
          created_at: string;
          id: string;
          member_id: string;
          trip_id: string;
          updated_at: string;
        };
        Insert: {
          activity_id: string;
          block_id: string;
          client_mutation_id?: string | null;
          created_at?: string;
          id?: string;
          member_id: string;
          trip_id: string;
          updated_at?: string;
        };
        Update: {
          activity_id?: string;
          block_id?: string;
          client_mutation_id?: string | null;
          created_at?: string;
          id?: string;
          member_id?: string;
          trip_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_block_id_fkey";
            columns: ["block_id"];
            isOneToOne: false;
            referencedRelation: "blocks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "trip_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_trip: {
        Args: {
          p_currency?: string;
          p_destination_text: string;
          p_display_name?: string;
          p_duplicate_policy?: string;
          p_end_date: string;
          p_lat?: number;
          p_lon?: number;
          p_name: string;
          p_pin?: string;
          p_start_date: string;
          p_timezone?: string;
        };
        Returns: {
          client_mutation_id: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          destination_text: string;
          duplicate_policy: string;
          end_date: string;
          id: string;
          invite_token_version: number;
          lat: number | null;
          lon: number | null;
          name: string;
          pin_hash: string | null;
          share_enabled: boolean;
          share_token_version: number;
          start_date: string;
          timezone: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "trips";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_trip_join_info: {
        Args: { p_trip_id: string };
        Returns: {
          destination_text: string;
          end_date: string;
          id: string;
          name: string;
          requires_pin: boolean;
          start_date: string;
        }[];
      };
      is_trip_member: { Args: { p_trip_id: string }; Returns: boolean };
      is_trip_organizer: { Args: { p_trip_id: string }; Returns: boolean };
      join_trip: {
        Args: { p_display_name?: string; p_pin?: string; p_trip_id: string };
        Returns: {
          client_mutation_id: string | null;
          created_at: string;
          display_name: string;
          id: string;
          joined_at: string;
          role: string;
          trip_id: string;
          updated_at: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "trip_members";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      my_member_id: { Args: { p_trip_id: string }; Returns: string };
      swap_block_commits: {
        Args: { p_block_a: string; p_block_b: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
