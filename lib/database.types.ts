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
          booking_type: "external" | "internal";
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
          booking_type?: "external" | "internal";
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
          booking_type?: "external" | "internal";
          is_active?: boolean;
          is_booking_open?: boolean;
        };
      };
      event_booking_fields: {
        Row: {
          id: string;
          event_id: string;
          field_name: string;
          field_label: string;
          field_type: "text" | "email" | "tel" | "number" | "textarea" | "select";
          field_options: string[];
          is_required: boolean;
          field_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          field_name: string;
          field_label: string;
          field_type?: "text" | "email" | "tel" | "number" | "textarea" | "select";
          field_options?: string[];
          is_required?: boolean;
          field_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          field_name?: string;
          field_label?: string;
          field_type?: "text" | "email" | "tel" | "number" | "textarea" | "select";
          field_options?: string[];
          is_required?: boolean;
          field_order?: number;
          created_at?: string;
        };
      };
      event_bookings: {
        Row: {
          id: string;
          event_id: string;
          booking_data: Record<string, string>;
          status: "pending" | "approved" | "rejected";
          notes: string | null;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          booking_data: Record<string, string>;
          status?: "pending" | "approved" | "rejected";
          notes?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          booking_data?: Record<string, string>;
          status?: "pending" | "approved" | "rejected";
          notes?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          is_master_admin: boolean;
          is_suspended: boolean;
          suspended_at: string | null;
          suspended_by: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          is_master_admin?: boolean;
          is_suspended?: boolean;
          suspended_at?: string | null;
          suspended_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          is_master_admin?: boolean;
          is_suspended?: boolean;
          suspended_at?: string | null;
          suspended_by?: string | null;
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
export type EventBookingField = Database["public"]["Tables"]["event_booking_fields"]["Row"];
export type EventBooking = Database["public"]["Tables"]["event_bookings"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AdminInvite = Database["public"]["Tables"]["admin_invites"]["Row"];

// Helper types for form building
export type BookingFieldType = EventBookingField["field_type"];

export interface BookingFieldConfig {
  field_name: string;
  field_label: string;
  field_type: BookingFieldType;
  field_options?: string[];
  is_required: boolean;
}
