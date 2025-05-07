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
        Relationships: [
          {
            foreignKeyName: "alerts_tracker_id_fkey"
            columns: ["tracker_id"]
            referencedRelation: "trackers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "location_history_tracker_id_fkey"
            columns: ["tracker_id"]
            referencedRelation: "trackers"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "trackers_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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