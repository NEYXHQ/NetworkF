import { useEffect, useState, type ReactNode } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { WEB3AUTH_NETWORK, type IProvider } from '@web3auth/base';
import config from '../config/env';
import { Web3AuthContext, type UserInfo, type Web3AuthContextType } from './Web3AuthContext';

interface Web3AuthProviderProps {
  children: ReactNode;
}

export const Web3AuthProvider = ({ children }: Web3AuthProviderProps) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        if (!config.web3AuthClientId) {
          console.error('Web3Auth Client ID not found');
          setIsLoading(false);
          return;
        }

        const web3authInstance = new Web3Auth({
          clientId: config.web3AuthClientId,
          // web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        });

        await web3authInstance.init();
        setWeb3auth(web3authInstance);

        if (web3authInstance.connected) {
          setProvider(web3authInstance.provider);
          const user = await web3authInstance.getUserInfo();
          setUser(user);
        }
      } catch (error) {
        console.error('Web3Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      console.log('Web3Auth not initialized yet');
      return;
    }
    const web3authProvider = await web3auth.connect();
    setProvider(web3authProvider);
    const user = await web3auth.getUserInfo();
    setUser(user);
  };

  const logout = async () => {
    if (!web3auth) {
      console.log('Web3Auth not initialized yet');
      return;
    }
    await web3auth.logout();
    setProvider(null);
    setUser(null);
  };

  const getUserInfo = async (): Promise<UserInfo | null> => {
    if (web3auth) {
      const user = await web3auth.getUserInfo();
      return user as UserInfo;
    }
    return null;
  };

  const getAccounts = async () => {
    if (!provider) {
      return [];
    }
    try {
      const accounts = await provider.request({
        method: 'eth_accounts',
      });
      return accounts as string[];
    } catch (error) {
      console.error('Error getting accounts:', error);
      return [];
    }
  };

  const value: Web3AuthContextType = {
    web3auth,
    provider,
    user,
    isLoading,
    isConnected: !!provider,
    login,
    logout,
    getUserInfo,
    getAccounts,
  };

  if (!config.web3AuthClientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-600">
            Web3Auth Client ID is missing. Please check your environment variables.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Add VITE_WEB3AUTH_CLIENT_ID to your .env file
          </p>
        </div>
      </div>
    );
  }

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
}; 