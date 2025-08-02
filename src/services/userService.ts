import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import { emailService } from './emailService'

type UserRow = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

// LinkedIn specific types
export interface LinkedInPosition {
  id?: string
  title?: string
  company?: string
  location?: string
  startDate?: string
  endDate?: string
  current?: boolean
  description?: string
}

export interface LinkedInEducation {
  id?: string
  school?: string
  degree?: string
  fieldOfStudy?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface LinkedInSkill {
  name?: string
  endorsements?: number
}

export interface LinkedInUserData {
  email?: string
  name?: string
  profileImage?: string
  linkedinId?: string
  linkedinUrl?: string
  headline?: string
  location?: string
  industry?: string
  summary?: string
  positions?: LinkedInPosition[]
  educations?: LinkedInEducation[]
  skills?: LinkedInSkill[]
  connectionsCount?: number
  publicProfileUrl?: string
}

class UserService {
  /**
   * Create or update user from LinkedIn data
   */
  async upsertUserFromLinkedIn(linkedinData: LinkedInUserData, authUserId: string): Promise<UserRow | null> {
    try {
      // Check if authUserId is a valid UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUserId)
      
      // First, check if user already exists to determine if we need to send welcome email
      let existingUser = null;
      try {
        if (isUUID) {
          const { data } = await supabase.from('users').select('id').eq('id', authUserId).single();
          existingUser = data;
        } else if (linkedinData.email) {
          const { data } = await supabase.from('users').select('id').eq('email', linkedinData.email).single();
          existingUser = data;
        }
      } catch {
        // User doesn't exist, this is fine
      }
      
      const isNewUser = !existingUser;
      
      const userData: UserInsert = {
        id: isUUID ? authUserId : undefined, // Only set ID if it's a valid UUID
        email: linkedinData.email,
        name: linkedinData.name,
        profile_image: linkedinData.profileImage,
        linkedin_id: linkedinData.linkedinId,
        linkedin_url: linkedinData.linkedinUrl,
        headline: linkedinData.headline,
        location: linkedinData.location,
        industry: linkedinData.industry,
        summary: linkedinData.summary,
        positions: linkedinData.positions as Database['public']['Tables']['users']['Insert']['positions'],
        educations: linkedinData.educations as Database['public']['Tables']['users']['Insert']['educations'],
        skills: linkedinData.skills as Database['public']['Tables']['users']['Insert']['skills'],
        connections_count: linkedinData.connectionsCount,
        public_profile_url: linkedinData.publicProfileUrl,
        email_verified: true, // Assume LinkedIn email is verified
        status: 'pending', // All new users start as pending
        last_login_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from('users').upsert(userData, { 
        onConflict: isUUID ? 'id' : 'email',
        ignoreDuplicates: false 
      }).select().single()

      if (error) {
        console.error('Error upserting user:', error)
        throw error
      }

      // Send welcome email for new users only
      if (isNewUser && linkedinData.email) {
        console.log('🎉 New user registered, sending welcome email...');
        
        // Send welcome email asynchronously (don't block user registration if email fails)
        emailService.sendWelcomeEmail({
          to: linkedinData.email,
          userName: linkedinData.name,
        }).then((result) => {
          if (result.success) {
            console.log('✅ Welcome email sent successfully to new user:', linkedinData.email);
          } else {
            console.warn('⚠️ Failed to send welcome email (registration still successful):', result.error);
          }
        }).catch((emailError) => {
          console.warn('⚠️ Welcome email error (registration still successful):', emailError);
        });
      }

      return data
    } catch (error) {
      console.error('UserService.upsertUserFromLinkedIn error:', error)
      throw error
    }
  }

  /**
   * Get user by ID (UUID) or email
   */
  async getUserById(id: string): Promise<UserRow | null> {
    try {
      // Check if the ID is a valid UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      
      let query = supabase.from('users').select('*')
      
      if (isUUID) {
        query = query.eq('id', id)
      } else {
        // If not a UUID, treat as email
        query = query.eq('email', id)
      }

      const { data, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null
        }
        console.error('Error getting user:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('UserService.getUserById error:', error)
      throw error
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserRow | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null
        }
        console.error('Error getting user by email:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('UserService.getUserByEmail error:', error)
      throw error
    }
  }

  /**
   * Update user profile
   */
  async updateUser(id: string, updates: UserUpdate): Promise<UserRow | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('UserService.updateUser error:', error)
      throw error
    }
  }

  /**
   * Update user status (for admin approval)
   */
  async updateUserStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<UserRow | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user status:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('UserService.updateUserStatus error:', error)
      throw error
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('Error updating last login:', error)
        throw error
      }
    } catch (error) {
      console.error('UserService.updateLastLogin error:', error)
      throw error
    }
  }

  /**
   * Get all users (admin function)
   */
  async getAllUsers(status?: 'pending' | 'approved' | 'rejected'): Promise<UserRow[]> {
    try {
      let query = supabase.from('users').select('*')
      
      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting all users:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('UserService.getAllUsers error:', error)
      throw error
    }
  }

  /**
   * Get user stats
   */
  async getUserStats(): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
  }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('status')

      if (error) {
        console.error('Error getting user stats:', error)
        throw error
      }

      const stats = {
        total: data.length,
        pending: data.filter(u => u.status === 'pending').length,
        approved: data.filter(u => u.status === 'approved').length,
        rejected: data.filter(u => u.status === 'rejected').length,
      }

      return stats
    } catch (error) {
      console.error('UserService.getUserStats error:', error)
      throw error
    }
  }

  /**
   * Delete user (admin function)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting user:', error)
        throw error
      }
    } catch (error) {
      console.error('UserService.deleteUser error:', error)
      throw error
    }
  }
}

export const userService = new UserService()
export default userService 