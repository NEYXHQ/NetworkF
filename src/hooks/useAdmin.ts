import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useWeb3Auth } from './useWeb3Auth';
import type { Database } from '../lib/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];
type ConnectionRow = Database['public']['Tables']['connections']['Row'];

export const useAdmin = () => {
  const { user } = useWeb3Auth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [userStats, setUserStats] = useState({
    total_users: 0,
    pending_users: 0,
    approved_users: 0,
    rejected_users: 0,
    admin_users: 0,
  });
  const [connectionStats, setConnectionStats] = useState({
    total_connections: 0,
    pending_connections: 0,
    accepted_connections: 0,
    rejected_connections: 0,
  });
  const [growthStats, setGrowthStats] = useState({
    new_users_today: 0,
    new_users_week: 0,
    new_users_month: 0,
  });

  // Check admin status on mount
  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      const userEmail = user?.email || user?.verifierId;
      console.log('Checking admin status for user:', userEmail);
      const adminStatus = await adminService.isCurrentUserAdmin(userEmail);
      console.log('Admin status result:', adminStatus);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await adminService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.log('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadConnections = async () => {
    try {
      const connectionsData = await adminService.getAllConnections();
      setConnections(connectionsData);
    } catch (error) {
      console.log('Error loading connections:', error);
      setConnections([]);
    }
  };

  const loadStatistics = async () => {
    try {
      const [userStatsData, connectionStatsData, growthStatsData] = await Promise.all([
        adminService.getUserStats(),
        adminService.getConnectionStats(),
        adminService.getGrowthStats(),
      ]);

      setUserStats(userStatsData);
      setConnectionStats(connectionStatsData);
      setGrowthStats(growthStatsData);
    } catch (error) {
      console.log('Error loading statistics, using defaults:', error);
      // Keep default values (already set in useState)
    }
  };

  const updateUserStatus = async (userId: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      await adminService.updateUserStatus(userId, status);
      await loadUsers(); // Reload users to get updated data
      await loadStatistics(); // Reload stats
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  };

  const toggleAdminStatus = async (userId: string) => {
    try {
      await adminService.toggleAdminStatus(userId);
      await loadUsers(); // Reload users to get updated data
      await loadStatistics(); // Reload stats
    } catch (error) {
      console.error('Error toggling admin status:', error);
      throw error;
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: 'pending' | 'accepted' | 'rejected' | 'cancelled') => {
    try {
      await adminService.updateConnectionStatus(connectionId, status);
      await loadConnections(); // Reload connections to get updated data
      await loadStatistics(); // Reload stats
    } catch (error) {
      console.error('Error updating connection status:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await adminService.deleteUser(userId);
      await loadUsers(); // Reload users to get updated data
      await loadStatistics(); // Reload stats
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const refreshAllData = async () => {
    try {
      await Promise.all([
        loadUsers(),
        loadConnections(),
        loadStatistics(),
      ]);
    } catch (error) {
      console.error('Error refreshing admin data:', error);
    }
  };

  return {
    isAdmin,
    isLoading,
    users,
    connections,
    userStats,
    connectionStats,
    growthStats,
    loadUsers,
    loadConnections,
    loadStatistics,
    updateUserStatus,
    toggleAdminStatus,
    updateConnectionStatus,
    deleteUser,
    refreshAllData,
    checkAdminStatus,
  };
}; 