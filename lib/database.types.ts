export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          date: string;
          time: string;
          location: string;
          image_url: string | null;
          booking_link: string | null;
          is_active: boolean;
          is_booking_open: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          date: string;
          time: string;
          location: string;
          image_url?: string | null;
          booking_link?: string | null;
          is_active?: boolean;
          is_booking_open?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          date?: string;
          time?: string;
          location?: string;
          image_url?: string | null;
          booking_link?: string | null;
          is_active?: boolean;
          is_booking_open?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          is_master_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          is_master_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          is_master_admin?: boolean;
          created_at?: string;
        };
      };
      admin_invites: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          invitation_token: string;
          is_confirmed: boolean;
          invited_by: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          email: string;
          invitation_token: string;
          is_confirmed?: boolean;
          invited_by: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          invitation_token?: string;
          is_confirmed?: boolean;
          invited_by?: string;
        };
      };
    };
  };
}

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AdminInvite = Database["public"]["Tables"]["admin_invites"]["Row"];
