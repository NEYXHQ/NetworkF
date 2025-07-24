import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { Button } from '../ui/Button';
import { User, LogOut, Settings, Wallet } from 'lucide-react';

export const Header = () => {
  const { user, isConnected, isLoading, login, logout, getAccounts } = useWeb3Auth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const showWalletInfo = async () => {
    try {
      const accounts = await getAccounts();
      if (accounts.length > 0) {
        alert(`Wallet Address: ${accounts[0]}`);
      }
    } catch (error) {
      console.error('Error getting accounts:', error);
    }
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
            ) : isConnected && user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {user.name || user.email || 'User'}
                </span>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={showWalletInfo}>
                    <Wallet className="h-4 w-4" />
                  </Button>
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