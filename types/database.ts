export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "admin" | "client";
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: "admin" | "client";
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "admin" | "client";
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          profile_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number | null;
          duration_minutes: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price?: number | null;
          duration_minutes?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          duration_minutes?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      availability: {
        Row: {
          id: string;
          date: string;
          start_time: string;
          end_time: string;
          is_booked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          start_time: string;
          end_time: string;
          is_booked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          is_booked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          client_id: string | null;
          service_id: string | null;
          availability_id: string | null;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          service_id?: string | null;
          availability_id?: string | null;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          service_id?: string | null;
          availability_id?: string | null;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          client_id: string | null;
          booking_id: string | null;
          title: string;
          type: string | null;
          shoot_date: string | null;
          status: "upcoming" | "shot" | "editing" | "delivered";
          video_delivery_method: "cloudflare" | "whatsapp" | "not_applicable" | null;
          video_delivery_status: "not_sent" | "sent" | "not_applicable" | null;
          video_delivered_at: string | null;
          video_delivery_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          booking_id?: string | null;
          title: string;
          type?: string | null;
          shoot_date?: string | null;
          status?: "upcoming" | "shot" | "editing" | "delivered";
          video_delivery_method?: "cloudflare" | "whatsapp" | "not_applicable" | null;
          video_delivery_status?: "not_sent" | "sent" | "not_applicable" | null;
          video_delivered_at?: string | null;
          video_delivery_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          booking_id?: string | null;
          title?: string;
          type?: string | null;
          shoot_date?: string | null;
          status?: "upcoming" | "shot" | "editing" | "delivered";
          video_delivery_method?: "cloudflare" | "whatsapp" | "not_applicable" | null;
          video_delivery_status?: "not_sent" | "sent" | "not_applicable" | null;
          video_delivered_at?: string | null;
          video_delivery_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      galleries: {
        Row: {
          id: string;
          project_id: string | null;
          title: string;
          is_public: boolean;
          cover_media_id: string | null;
          expires_at: string | null;
          published_notified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          title: string;
          is_public?: boolean;
          cover_media_id?: string | null;
          expires_at?: string | null;
          published_notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          title?: string;
          is_public?: boolean;
          cover_media_id?: string | null;
          expires_at?: string | null;
          published_notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          gallery_id: string | null;
          type: "image" | "video";
          storage_path: string | null;
          cloudflare_stream_uid: string | null;
          stream_status: "uploading" | "processing" | "ready" | "error" | null;
          thumbnail_url: string | null;
          is_favorite: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gallery_id?: string | null;
          type: "image" | "video";
          storage_path?: string | null;
          cloudflare_stream_uid?: string | null;
          stream_status?: "uploading" | "processing" | "ready" | "error" | null;
          thumbnail_url?: string | null;
          is_favorite?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gallery_id?: string | null;
          type?: "image" | "video";
          storage_path?: string | null;
          cloudflare_stream_uid?: string | null;
          stream_status?: "uploading" | "processing" | "ready" | "error" | null;
          thumbnail_url?: string | null;
          is_favorite?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          client_id: string | null;
          project_id: string | null;
          amount: number;
          currency: string;
          status: "pending" | "paid" | "failed" | "refunded";
          payment_method: "paypal" | "mpesa" | "manual" | null;
          payment_reference: string | null;
          description: string | null;
          mpesa_checkout_request_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          project_id?: string | null;
          amount: number;
          currency?: string;
          status?: "pending" | "paid" | "failed" | "refunded";
          payment_method?: "paypal" | "mpesa" | "manual" | null;
          payment_reference?: string | null;
          description?: string | null;
          mpesa_checkout_request_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          project_id?: string | null;
          amount?: number;
          currency?: string;
          status?: "pending" | "paid" | "failed" | "refunded";
          payment_method?: "paypal" | "mpesa" | "manual" | null;
          payment_reference?: string | null;
          description?: string | null;
          mpesa_checkout_request_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string | null;
          cover_image_url: string | null;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content?: string | null;
          cover_image_url?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: string | null;
          cover_image_url?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      error_logs: {
        Row: {
          id: string;
          source: string | null;
          message: string | null;
          stack: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source?: string | null;
          message?: string | null;
          stack?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source?: string | null;
          message?: string | null;
          stack?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
