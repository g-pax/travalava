export interface Database {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string;
          name: string;
          destination_text: string;
          lat: number | null;
          lon: number | null;
          start_date: string;
          end_date: string;
          timezone: string;
          currency: string;
          duplicate_policy: "soft_block" | "prevent" | "allow";
          invite_token_version: number;
          share_enabled: boolean;
          share_token_version: number;
          pin_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          destination_text: string;
          lat?: number | null;
          lon?: number | null;
          start_date: string;
          end_date: string;
          timezone?: string;
          currency?: string;
          duplicate_policy?: "soft_block" | "prevent" | "allow";
          invite_token_version?: number;
          share_enabled?: boolean;
          share_token_version?: number;
          pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          destination_text?: string;
          lat?: number | null;
          lon?: number | null;
          start_date?: string;
          end_date?: string;
          timezone?: string;
          currency?: string;
          duplicate_policy?: "soft_block" | "prevent" | "allow";
          invite_token_version?: number;
          share_enabled?: boolean;
          share_token_version?: number;
          pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          role: "organizer" | "collaborator";
          display_name: string;
          user_id: string | null;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          role: "organizer" | "collaborator";
          display_name: string;
          user_id?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          role?: "organizer" | "collaborator";
          display_name?: string;
          user_id?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      days: {
        Row: {
          id: string;
          trip_id: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      blocks: {
        Row: {
          id: string;
          day_id: string;
          label: string;
          position: number;
          vote_open_ts: string | null;
          vote_close_ts: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          day_id: string;
          label: string;
          position: number;
          vote_open_ts?: string | null;
          vote_close_ts?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          day_id?: string;
          label?: string;
          position?: number;
          vote_open_ts?: string | null;
          vote_close_ts?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          category: string | null;
          cost_amount: number | null;
          cost_currency: string | null;
          duration_min: number | null;
          notes: string | null;
          link: string | null;
          location: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          title: string;
          category?: string | null;
          cost_amount?: number | null;
          cost_currency?: string | null;
          duration_min?: number | null;
          notes?: string | null;
          link?: string | null;
          location?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          title?: string;
          category?: string | null;
          cost_amount?: number | null;
          cost_currency?: string | null;
          duration_min?: number | null;
          notes?: string | null;
          link?: string | null;
          location?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      block_proposals: {
        Row: {
          id: string;
          trip_id: string;
          block_id: string;
          activity_id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          block_id: string;
          activity_id: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          block_id?: string;
          activity_id?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          trip_id: string;
          block_id: string;
          activity_id: string;
          member_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          block_id: string;
          activity_id: string;
          member_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          block_id?: string;
          activity_id?: string;
          member_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      commits: {
        Row: {
          id: string;
          trip_id: string;
          block_id: string;
          activity_id: string;
          committed_by: string;
          committed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          block_id: string;
          activity_id: string;
          committed_by: string;
          committed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          block_id?: string;
          activity_id?: string;
          committed_by?: string;
          committed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
