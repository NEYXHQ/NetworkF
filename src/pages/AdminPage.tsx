import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { Button } from '../components/ui/Button';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  TrendingUp, 
  Activity, 
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  ArrowLeft,
  UserMinus
} from 'lucide-react';

export const AdminPage = () => {
  const navigate = useNavigate();
  const { isConnected } = useWeb3Auth();
  const {
    isAdmin,
    isLoading,
    users,
    connections,
    userStats,
    connectionStats,
    growthStats,
    updateUserStatus,
    // toggleAdminStatus,
    updateConnectionStatus,
    deleteUser,
    refreshAllData,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'connections'>('dashboard');
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      navigate('/admin/login');
      return;
    }

    if (!isLoading && !isAdmin) {
      navigate('/admin/login');
      return;
    }

    if (isAdmin) {
      refreshAllData();
    }
  }, [isConnected, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      refreshAllData();
    }
  }, [isAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
          <Button onClick={() => navigate('/admin/login')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Login
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Approved</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  const getConnectionStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Accepted</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Rejected</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Cancelled</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={refreshAllData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'connections'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Connections ({connections.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <UserCheck className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved Users</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.approved_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Users</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.pending_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Shield className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Admin Users</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.admin_users}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Connections</p>
                    <p className="text-2xl font-bold text-gray-900">{connectionStats.total_connections}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Accepted</p>
                    <p className="text-2xl font-bold text-gray-900">{connectionStats.accepted_connections}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Connections</p>
                    <p className="text-2xl font-bold text-gray-900">{connectionStats.pending_connections}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">{connectionStats.rejected_connections}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">New Users Today</p>
                    <p className="text-2xl font-bold text-gray-900">{growthStats.new_users_today}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">New Users This Week</p>
                    <p className="text-2xl font-bold text-gray-900">{growthStats.new_users_week}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">New Users This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{growthStats.new_users_month}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowDeletedUsers(!showDeletedUsers)}
                  variant="outline"
                  size="sm"
                >
                  {showDeletedUsers ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showDeletedUsers ? 'Hide' : 'Show'} Deleted
                </Button>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user.id} className="px-6 py-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.profile_image || 'https://via.placeholder.com/40'}
                            alt={user.name || 'User'}
                          />
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.name || 'Unknown User'}
                            </p>
                            {user.is_admin && (
                              <Shield className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(user.status || 'pending')}
                            <span className="text-xs text-gray-500">
                              Joined {formatDate(user.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="text-left sm:text-right">
                          <p className="text-sm text-gray-900">
                            Connections: {user.total_connections || 0}
                          </p>
                          <p className="text-xs text-gray-500">
                            Successful: {user.successful_connections || 0}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {user.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => updateUserStatus(user.id, 'approved')}
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                title="Approve User"
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => updateUserStatus(user.id, 'rejected')}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                title="Reject User"
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          
                          {user.status === 'approved' && (
                            <Button
                              onClick={() => updateUserStatus(user.id, 'pending')}
                              size="sm"
                              variant="outline"
                              className="text-orange-600 hover:text-orange-700"
                              title="Unapprove User"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {user.status === 'rejected' && (
                            <Button
                              onClick={() => updateUserStatus(user.id, 'approved')}
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              title="Approve User"
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => deleteUser(user.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Connection Management</h2>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {connections.map((connection) => (
                  <li key={connection.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0 h-8 w-8">
                            <img
                              className="h-8 w-8 rounded-full"
                              src="https://via.placeholder.com/32"
                              alt="User"
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            User {connection.initiator_id?.slice(0, 8)}
                          </span>
                        </div>
                        <span className="text-gray-500">→</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0 h-8 w-8">
                            <img
                              className="h-8 w-8 rounded-full"
                              src="https://via.placeholder.com/32"
                              alt="User"
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            User {connection.recipient_id?.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getConnectionStatusBadge(connection.status || 'pending')}
                        <span className="text-xs text-gray-500">
                          {formatDate(connection.created_at)}
                        </span>
                        {connection.status === 'pending' && (
                          <div className="flex space-x-1">
                            <Button
                              onClick={() => updateConnectionStatus(connection.id, 'accepted')}
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => updateConnectionStatus(connection.id, 'rejected')}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {connection.message && (
                      <div className="mt-2 text-sm text-gray-600">
                        "{connection.message}"
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 