export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      alerts: {
        Row: {
          id: string
          user_id: string
          tracker_id: string
          type: 'left_behind' | 'moved' | 'low_battery' | 'out_of_range' | 'custom'
          title: string
          message: string
          icon: string | null
          is_read: boolean
          is_active: boolean
          data: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          tracker_id: string
          type: 'left_behind' | 'moved' | 'low_battery' | 'out_of_range' | 'custom'
          title: string
          message: string
          icon?: string | null
          is_read?: boolean
          is_active?: boolean
          data?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          tracker_id?: string
          type?: 'left_behind' | 'moved' | 'low_battery' | 'out_of_range' | 'custom'
          title?: string
          message?: string
          icon?: string | null
          is_read?: boolean
          is_active?: boolean
          data?: Json | null
          timestamp?: string
        }
      }
      location_history: {
        Row: {
          id: string
          tracker_id: string
          latitude: number
          longitude: number
          accuracy: number | null
          timestamp: string
        }
        Insert: {
          id?: string
          tracker_id: string
          latitude: number
          longitude: number
          accuracy?: number | null
          timestamp?: string
        }
        Update: {
          id?: string
          tracker_id?: string
          latitude?: number
          longitude?: number
          accuracy?: number | null
          timestamp?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trackers: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'physical' | 'virtual'
          icon: string | null
          battery_level: number | null
          is_active: boolean
          last_seen_latitude: number | null
          last_seen_longitude: number | null
          last_seen_timestamp: string | null
          connection_status: 'connected' | 'disconnected' | 'connecting' | 'unknown' | null
          ble_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'physical' | 'virtual'
          icon?: string | null
          battery_level?: number | null
          is_active?: boolean
          last_seen_latitude?: number | null
          last_seen_longitude?: number | null
          last_seen_timestamp?: string | null
          connection_status?: 'connected' | 'disconnected' | 'connecting' | 'unknown' | null
          ble_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'physical' | 'virtual'
          icon?: string | null
          battery_level?: number | null
          is_active?: boolean
          last_seen_latitude?: number | null
          last_seen_longitude?: number | null
          last_seen_timestamp?: string | null
          connection_status?: 'connected' | 'disconnected' | 'connecting' | 'unknown' | null
          ble_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          push_notifications: boolean
          alert_sounds: boolean
          vibration: boolean
          left_behind_alerts: boolean
          low_battery_alerts: boolean
          movement_alerts: boolean
          save_location_history: boolean
          share_analytics: boolean
          dark_mode: boolean
          distance_unit: 'metric' | 'imperial'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          push_notifications?: boolean
          alert_sounds?: boolean
          vibration?: boolean
          left_behind_alerts?: boolean
          low_battery_alerts?: boolean
          movement_alerts?: boolean
          save_location_history?: boolean
          share_analytics?: boolean
          dark_mode?: boolean
          distance_unit?: 'metric' | 'imperial'
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          push_notifications?: boolean
          alert_sounds?: boolean
          vibration?: boolean
          left_behind_alerts?: boolean
          low_battery_alerts?: boolean
          movement_alerts?: boolean
          save_location_history?: boolean
          share_analytics?: boolean
          dark_mode?: boolean
          distance_unit?: 'metric' | 'imperial'
          created_at?: string
          updated_at?: string
        }
      }
      // Adding admin_users table for admin authentication
      admin_users: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      // Adding logistics requests table for handling lost trackers
      logistics_requests: {
        Row: {
          id: string
          tracker_id: string
          user_id: string
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          created_at: string
          updated_at: string
          tracking_number: string | null
          shipping_address: string | null
          notes: string | null
          carrier: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
        }
        Insert: {
          id?: string
          tracker_id: string
          user_id: string
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          created_at?: string
          updated_at?: string
          tracking_number?: string | null
          shipping_address?: string | null
          notes?: string | null
          carrier?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
        }
        Update: {
          id?: string
          tracker_id?: string
          user_id?: string
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          created_at?: string
          updated_at?: string
          tracking_number?: string | null
          shipping_address?: string | null
          notes?: string | null
          carrier?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_alert: {
        Args: {
          tracker_id: string
          alert_type: string
          alert_title: string
          alert_message: string
          alert_icon?: string
          alert_data?: Json
        }
        Returns: string
      }
      update_tracker_location: {
        Args: {
          tracker_id: string
          lat: number
          lng: number
          accuracy?: number
        }
        Returns: undefined
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

// Additional custom types for the admin portal
export interface TrackerWithUserInfo extends Database['public']['Tables']['trackers']['Row'] {
  user_email: string;
  user_name: string;
  is_lost?: boolean; // Derived field based on connection status and last seen timestamp
  recovery_status?: 'lost' | 'normal' | 'recovering'; // Derived field from recovery tracking
}

export interface UserWithTrackersCount extends Database['public']['Tables']['profiles']['Row'] {
  trackers_count: number;
  active_trackers_count: number;
}

export interface LogisticsRequestWithDetails extends Database['public']['Tables']['logistics_requests']['Row'] {
  // Additional fields derived from relations
  tracker_name: string;
  user_email: string;
  user_name: string;
  user_phone?: string;
  user_address?: string;
  // Nested relations from the query
  trackers?: Database['public']['Tables']['trackers']['Row'] | null;
  profiles?: Database['public']['Tables']['profiles']['Row'] | null;
}

export interface LogisticsApiResponse {
  success: boolean;
  trackingNumber?: string;
  estimatedDelivery?: string;
  errors?: string[];
}