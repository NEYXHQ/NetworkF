import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];
type ConnectionRow = Database['public']['Tables']['connections']['Row'];
type AppStatisticsRow = Database['public']['Tables']['app_statistics']['Row'];

class AdminService {
  // Check if current user is admin
  async isCurrentUserAdmin(userEmail?: string): Promise<boolean> {
    try {
      let email = userEmail;
      
      // If no email provided, try to get from Supabase auth
      if (!email) {
        const { data: { user } } = await supabase.auth.getUser();
        email = user?.email;
      }

      if (!email) {
        console.log('No user email found');
        return false;
      }

      console.log('Checking admin status for email:', email);

      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      console.log('Admin check result:', data?.is_admin);
      return data?.is_admin || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Get all users with admin info
  async getAllUsers(): Promise<UserRow[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<UserRow | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Update user status
  async updateUserStatus(userId: string, status: 'pending' | 'approved' | 'rejected'): Promise<UserRow | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Toggle admin status
  async toggleAdminStatus(userId: string): Promise<UserRow | null> {
    try {
      // First get current admin status
      const currentUser = await this.getUserById(userId);
      if (!currentUser) throw new Error('User not found');

      const newAdminStatus = !currentUser.is_admin;

      const { data, error } = await supabase
        .from('users')
        .update({ is_admin: newAdminStatus })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling admin status:', error);
      throw error;
    }
  }

  // Get all connections
  async getAllConnections(): Promise<ConnectionRow[]> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          initiator:users!connections_initiator_id_fkey(id, name, email, profile_image),
          recipient:users!connections_recipient_id_fkey(id, name, email, profile_image)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  }

  // Get connections for a specific user
  async getUserConnections(userId: string): Promise<ConnectionRow[]> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          initiator:users!connections_initiator_id_fkey(id, name, email, profile_image),
          recipient:users!connections_recipient_id_fkey(id, name, email, profile_image)
        `)
        .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user connections:', error);
      throw error;
    }
  }

  // Update connection status
  async updateConnectionStatus(connectionId: string, status: 'pending' | 'accepted' | 'rejected' | 'cancelled'): Promise<ConnectionRow | null> {
    try {
      const updateData: { status: string; accepted_at?: string } = { status };
      if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('connections')
        .update(updateData)
        .eq('id', connectionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating connection status:', error);
      throw error;
    }
  }

  // Get app statistics
  async getAppStatistics(): Promise<AppStatisticsRow[]> {
    try {
      const { data, error } = await supabase
        .from('app_statistics')
        .select('*')
        .order('stat_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching app statistics:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(): Promise<{
    total_users: number;
    pending_users: number;
    approved_users: number;
    rejected_users: number;
    admin_users: number;
  }> {
    try {
      // Calculate stats directly from users table
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('status, is_admin');

      if (usersError) {
        console.log('Error fetching users for stats:', usersError);
        return {
          total_users: 0,
          pending_users: 0,
          approved_users: 0,
          rejected_users: 0,
          admin_users: 0,
        };
      }

      const total_users = users?.length || 0;
      const pending_users = users?.filter(u => u.status === 'pending').length || 0;
      const approved_users = users?.filter(u => u.status === 'approved').length || 0;
      const rejected_users = users?.filter(u => u.status === 'rejected').length || 0;
      const admin_users = users?.filter(u => u.is_admin === true).length || 0;

      console.log('Calculated user stats:', {
        total_users,
        pending_users,
        approved_users,
        rejected_users,
        admin_users
      });

      return {
        total_users,
        pending_users,
        approved_users,
        rejected_users,
        admin_users,
      };
    } catch (error) {
      console.log('Error calculating user stats:', error);
      return {
        total_users: 0,
        pending_users: 0,
        approved_users: 0,
        rejected_users: 0,
        admin_users: 0,
      };
    }
  }

  // Get connection statistics
  async getConnectionStats(): Promise<{
    total_connections: number;
    pending_connections: number;
    accepted_connections: number;
    rejected_connections: number;
  }> {
    try {
      // Calculate stats directly from connections table
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('status');

      if (connectionsError) {
        console.log('Error fetching connections for stats:', connectionsError);
        return {
          total_connections: 0,
          pending_connections: 0,
          accepted_connections: 0,
          rejected_connections: 0,
        };
      }

      const total_connections = connections?.length || 0;
      const pending_connections = connections?.filter(c => c.status === 'pending').length || 0;
      const accepted_connections = connections?.filter(c => c.status === 'accepted').length || 0;
      const rejected_connections = connections?.filter(c => c.status === 'rejected').length || 0;

      console.log('Calculated connection stats:', {
        total_connections,
        pending_connections,
        accepted_connections,
        rejected_connections
      });

      return {
        total_connections,
        pending_connections,
        accepted_connections,
        rejected_connections,
      };
    } catch (error) {
      console.log('Error calculating connection stats:', error);
      return {
        total_connections: 0,
        pending_connections: 0,
        accepted_connections: 0,
        rejected_connections: 0,
      };
    }
  }

  // Get growth statistics
  async getGrowthStats(): Promise<{
    new_users_today: number;
    new_users_week: number;
    new_users_month: number;
  }> {
    try {
      // Calculate growth stats directly from users table
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('created_at');

      if (usersError) {
        console.log('Error fetching users for growth stats:', usersError);
        return {
          new_users_today: 0,
          new_users_week: 0,
          new_users_month: 0,
        };
      }

      const new_users_today = users?.filter(u => {
        const userDate = new Date(u.created_at);
        return userDate >= today;
      }).length || 0;

      const new_users_week = users?.filter(u => {
        const userDate = new Date(u.created_at);
        return userDate >= weekAgo;
      }).length || 0;

      const new_users_month = users?.filter(u => {
        const userDate = new Date(u.created_at);
        return userDate >= monthAgo;
      }).length || 0;

      console.log('Calculated growth stats:', {
        new_users_today,
        new_users_week,
        new_users_month
      });

      return {
        new_users_today,
        new_users_week,
        new_users_month,
      };
    } catch (error) {
      console.log('Error calculating growth stats:', error);
      return {
        new_users_today: 0,
        new_users_week: 0,
        new_users_month: 0,
      };
    }
  }

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get recent activity
  async getRecentActivity(limit: number = 10): Promise<{
    users: UserRow[];
    connections: ConnectionRow[];
  }> {
    try {
      const [usersResponse, connectionsResponse] = await Promise.all([
        supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('connections')
          .select(`
            *,
            initiator:users!connections_initiator_id_fkey(id, name, email, profile_image),
            recipient:users!connections_recipient_id_fkey(id, name, email, profile_image)
          `)
          .order('created_at', { ascending: false })
          .limit(limit)
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (connectionsResponse.error) throw connectionsResponse.error;

      return {
        users: usersResponse.data || [],
        connections: connectionsResponse.data || [],
      };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService(); 