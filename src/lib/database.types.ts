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
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          profile_image: string | null
          linkedin_id: string | null
          linkedin_url: string | null
          headline: string | null
          location: string | null
          industry: string | null
          summary: string | null
          positions: Json | null
          educations: Json | null
          skills: Json | null
          connections_count: number | null
          public_profile_url: string | null
          email_verified: boolean | null
          status: 'pending' | 'approved' | 'rejected' | null
          created_at: string
          updated_at: string
          last_login_at: string | null
          is_admin: boolean | null
          total_connections: number | null
          successful_connections: number | null
          last_connection_at: string | null
          entity_name: string | null
          founding_idea: string | null
          survey_completed: boolean | null
          looking_for: string | null
          profile_completed: boolean | null
          profiler_profile_name: string | null
          profiler_profile_type: string | null
          profiler_completed_at: string | null
          profiler_confidence: number | null
        }
        Insert: {
          id?: string
          email?: string | null
          name?: string | null
          profile_image?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          headline?: string | null
          location?: string | null
          industry?: string | null
          summary?: string | null
          positions?: Json | null
          educations?: Json | null
          skills?: Json | null
          connections_count?: number | null
          public_profile_url?: string | null
          email_verified?: boolean | null
          status?: 'pending' | 'approved' | 'rejected' | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          is_admin?: boolean | null
          total_connections?: number | null
          successful_connections?: number | null
          last_connection_at?: string | null
          entity_name?: string | null
          founding_idea?: string | null
          survey_completed?: boolean | null
          looking_for?: string | null
          profile_completed?: boolean | null
          profiler_profile_name?: string | null
          profiler_profile_type?: string | null
          profiler_completed_at?: string | null
          profiler_confidence?: number | null
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          profile_image?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          headline?: string | null
          location?: string | null
          industry?: string | null
          summary?: string | null
          positions?: Json | null
          educations?: Json | null
          skills?: Json | null
          connections_count?: number | null
          public_profile_url?: string | null
          email_verified?: boolean | null
          status?: 'pending' | 'approved' | 'rejected' | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          is_admin?: boolean | null
          total_connections?: number | null
          successful_connections?: number | null
          last_connection_at?: string | null
          entity_name?: string | null
          founding_idea?: string | null
          survey_completed?: boolean | null
          looking_for?: string | null
          profile_completed?: boolean | null
          profiler_profile_name?: string | null
          profiler_profile_type?: string | null
          profiler_completed_at?: string | null
          profiler_confidence?: number | null
        }
        Relationships: []
      }
      connections: {
        Row: {
          id: string
          initiator_id: string | null
          recipient_id: string | null
          status: string | null
          message: string | null
          created_at: string
          updated_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          initiator_id?: string | null
          recipient_id?: string | null
          status?: string | null
          message?: string | null
          created_at?: string
          updated_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          initiator_id?: string | null
          recipient_id?: string | null
          status?: string | null
          message?: string | null
          created_at?: string
          updated_at?: string
          accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_users: {
        Row: {
          id: string
          user_id: string | null
          admin_level: string | null
          permissions: Json | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          admin_level?: string | null
          permissions?: Json | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          admin_level?: string | null
          permissions?: Json | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      app_statistics: {
        Row: {
          id: string
          stat_name: string | null
          stat_value: Json | null
          updated_at: string
        }
        Insert: {
          id?: string
          stat_name?: string | null
          stat_value?: Json | null
          updated_at?: string
        }
        Update: {
          id?: string
          stat_name?: string | null
          stat_value?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_status: 'pending' | 'approved' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface LinkedInPosition {
  title: string
  company: string
  location?: string
  description?: string
  startDate?: string
  endDate?: string
  current?: boolean
}

export interface LinkedInEducation {
  school: string
  degree?: string
  fieldOfStudy?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface LinkedInSkill {
  name: string
  level?: string
  endorsements?: number
}

export interface Connection {
  id: string
  initiator_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  message?: string
  created_at: string
  updated_at: string
  accepted_at?: string
}

export interface AdminUser {
  id: string
  user_id: string
  admin_level: 'moderator' | 'admin' | 'super_admin'
  permissions: Json
  created_at: string
  created_by?: string
}

export interface AppStatistics {
  user_stats: {
    total_users: number
    pending_users: number
    approved_users: number
    rejected_users: number
    admin_users: number
  }
  connection_stats: {
    total_connections: number
    pending_connections: number
    accepted_connections: number
    rejected_connections: number
  }
  growth_stats: {
    new_users_today: number
    new_users_week: number
    new_users_month: number
  }
} 