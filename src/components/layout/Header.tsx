import { useState, useRef, useEffect } from 'react';
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { useAdmin } from '../../hooks/useAdmin';
import { Button } from '../ui/Button';
import { EnvironmentChecker } from '../debug/EnvironmentChecker';
import { User, LogOut, Settings, Wallet, ChevronDown, Bug, Shield } from 'lucide-react';

interface HeaderProps {
  showWallet?: boolean;
  onToggleWallet?: () => void;
}

export const Header = ({ showWallet = false, onToggleWallet }: HeaderProps) => {
  const { user, isConnected, isLoading, isRestoringSession, login, logout } = useWeb3Auth();
  const { isAdmin } = useAdmin();
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



  const toggleEnvironmentDebugger = () => {
    setShowEnvironmentDebugger(!showEnvironmentDebugger);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-slate-gray border-b border-teal-blue/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            {/* Logo/Home Button */}
            <div className="flex items-center">
              <a 
                href="/" 
                className="text-xl md:text-2xl font-bold text-princeton-orange hover:opacity-80 transition-opacity cursor-pointer"
                title="Go to Home"
              >
                WFounders
              </a>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3 md:space-x-4">
              {isLoading ? (
                <div className="animate-pulse rounded-full h-7 w-16 md:h-8 md:w-20 bg-teal-blue/20"></div>
              ) : isConnected && user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 p-1.5 md:p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden flex items-center justify-center bg-teal-blue/20">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.name || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-3 h-3 md:w-4 md:h-4 text-teal-blue" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-soft-white hidden sm:block">
                      {user.name || user.email || 'User'}
                    </span>
                    <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-soft-white/70 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 z-50 bg-slate-gray border border-teal-blue/30">
                      <div className="px-4 py-2 border-b border-teal-blue/20">
                        <p className="text-sm font-medium text-soft-white">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-soft-white/70">
                          {user.email}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          if (onToggleWallet) {
                            onToggleWallet();
                          }
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-soft-white hover:bg-teal-blue/20 flex items-center space-x-2"
                      >
                        <Wallet className="w-3 h-3" />
                        <span>{showWallet ? 'Hide Wallet' : 'Show Wallet'}</span>
                      </button>
                      
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-soft-white hover:bg-teal-blue/20 flex items-center space-x-2"
                      >
                        <Settings className="w-3 h-3" />
                        <span>Settings</span>
                      </button>
                      
                      {/* Environment Debugger toggle - temporarily enabled in production */}
                      {/* {config.isDevelopment && ( */}
                        <button
                          onClick={toggleEnvironmentDebugger}
                          className="w-full text-left px-4 py-2 text-sm text-soft-white hover:bg-teal-blue/20 flex items-center space-x-2"
                        >
                          <Bug className="w-3 h-3" />
                          <span>{showEnvironmentDebugger ? 'Hide' : 'Show'} Debug Panel</span>
                        </button>
                      {/* )} */}
                      
                      {/* Admin-only Admin Link */}
                      {isAdmin && (
                        <a
                          href="/admin"
                          className="w-full text-left px-4 py-2 text-sm text-soft-white hover:bg-teal-blue/20 flex items-center space-x-2"
                        >
                          <Shield className="w-3 h-3" />
                          <span>Admin Dashboard</span>
                        </a>
                      )}
                      
                      {/* Admin Login Link for non-admin users */}
                      {!isAdmin && (
                        <a
                          href="/admin/login"
                          className="w-full text-left px-4 py-2 text-sm text-soft-white hover:bg-teal-blue/20 flex items-center space-x-2"
                        >
                          <Shield className="w-3 h-3" />
                          <span>Admin Access</span>
                        </a>
                      )}
                      
                      <div className="my-1 border-t border-teal-blue/20"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-princeton-orange hover:bg-princeton-orange/20 flex items-center space-x-2"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button 
                  onClick={handleLogin}
                  variant="primary"
                  className="text-sm px-4 py-2"
                  loading={isRestoringSession}
                  loadingText="Restoring Session..."
                  disabled={isRestoringSession}
                >
                  <User className="mr-2 h-3 w-3" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Environment Debugger - temporarily enabled in production */}
      {/* {config.isDevelopment && */ showEnvironmentDebugger && (
        <div className="fixed bottom-4 right-4 z-40">
          <EnvironmentChecker />
        </div>
      )/* } */}
    </>
  );
}; 