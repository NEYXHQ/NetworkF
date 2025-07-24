import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '../ui/Button';
import { User, LogOut, Settings } from 'lucide-react';

export const Header = () => {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        connection: 'linkedin',
      },
    });
  };

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">NetworkF2</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </a>
            <a href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
              About
            </a>
            <a href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </a>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 rounded-full h-8 w-20"></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.name || user.email}</span>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleLogin}>
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}; 