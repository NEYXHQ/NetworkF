import { useState, useRef, useEffect } from 'react';
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { Button } from '../ui/Button';
import config from '../../config/env';
import { EnvironmentChecker } from '../debug/EnvironmentChecker';
import { User, LogOut, Settings, Wallet, ChevronDown, Bug } from 'lucide-react';

export const Header = () => {
  const { user, isConnected, isLoading, login, logout, getAccounts } = useWeb3Auth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEnvironmentDebugger, setShowEnvironmentDebugger] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setIsMenuOpen(false);
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
    setIsMenuOpen(false);
  };

  const toggleEnvironmentDebugger = () => {
    setShowEnvironmentDebugger(!showEnvironmentDebugger);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Home Button */}
            <div className="flex items-center">
              <a 
                href="/" 
                className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                title="Go to Home"
              >
                NetworkF2
              </a>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 rounded-full h-8 w-20"></div>
              ) : isConnected && user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.name || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.name || user.email || 'User'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.email}
                        </p>
                      </div>
                      
                      <button
                        onClick={showWalletInfo}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Show Wallet Info</span>
                      </button>
                      
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      
                      {/* Dev-only Environment Debugger toggle */}
                      {config.isDevelopment && (
                        <button
                          onClick={toggleEnvironmentDebugger}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Bug className="w-4 h-4" />
                          <span>{showEnvironmentDebugger ? 'Hide' : 'Show'} Debug Panel</span>
                        </button>
                      )}
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
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

      {/* Environment Debugger - Only show when toggled in dev mode */}
      {config.isDevelopment && showEnvironmentDebugger && (
        <div className="fixed bottom-4 right-4 z-40">
          <EnvironmentChecker />
        </div>
      )}
    </>
  );
}; 