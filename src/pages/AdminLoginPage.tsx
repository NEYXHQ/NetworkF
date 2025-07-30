import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { useAdmin } from '../hooks/useAdmin';
import { Button } from '../components/ui/Button';
import { Shield, ArrowLeft, UserCheck, UserX, Loader } from 'lucide-react';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { isConnected, login, isLoading, user } = useWeb3Auth();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  useEffect(() => {
    console.log('AdminLoginPage - isConnected:', isConnected);
    console.log('AdminLoginPage - isAdmin:', isAdmin);
    console.log('AdminLoginPage - isAdminLoading:', isAdminLoading);
    console.log('AdminLoginPage - user:', user);
    
    // If user is connected and admin check is complete
    if (isConnected && !isAdminLoading) {
      if (isAdmin) {
        // User is admin, redirect to admin panel
        console.log('User is admin, redirecting to admin panel');
        navigate('/admin');
      }
    }
  }, [isConnected, isAdmin, isAdminLoading, navigate, user]);

  const handleLogin = async () => {
    try {
      setIsCheckingAdmin(true);
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  const handleBackToApp = () => {
    navigate('/');
  };

  // Show loading while checking admin status
  if (isLoading || isAdminLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isCheckingAdmin ? 'Checking admin access...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // If user is connected but not admin
  if (isConnected && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <UserX className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have admin privileges. Please contact an administrator to get access.
            </p>
            <div className="space-y-3">
              <Button onClick={handleBackToApp} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is connected and is admin, redirect to admin panel
  if (isConnected && isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to admin panel...</p>
        </div>
      </div>
    );
  }

  // Show login screen for non-connected users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h2>
          <p className="text-gray-600 mb-6">
            Please connect with LinkedIn to access the admin panel. You must have admin privileges to proceed.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={handleLogin} 
              className="w-full"
              disabled={isCheckingAdmin}
            >
              {isCheckingAdmin ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Connect with LinkedIn
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleBackToApp} 
              variant="outline" 
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Only users with admin privileges can access the admin panel. 
              If you believe you should have access, please contact an administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 