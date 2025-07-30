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
          email_verified: boolean
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
          last_login_at: string | null
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
          email_verified?: boolean
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
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
          email_verified?: boolean
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
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