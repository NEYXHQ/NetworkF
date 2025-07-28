import { useEffect, useState, type ReactNode } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { WEB3AUTH_NETWORK, type IProvider } from '@web3auth/base';
import config from '../config/env';
import { Web3AuthContext, type UserInfo, type Web3AuthContextType, type TokenBalance } from './Web3AuthContext';
import ethersRPC from '../hooks/ethersRPC';

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
          web3AuthNetwork: config.network.features.isTestnet
            ? WEB3AUTH_NETWORK.SAPPHIRE_DEVNET 
            : WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
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

  // Token operations implementation
  const getChainId = async (): Promise<string> => {
    if (!provider) throw new Error('Provider not available');
    try {
      return await ethersRPC.getChainId(provider);
    } catch (error) {
      console.error('Error getting chain ID:', error);
      return '';
    }
  };

  const getNEYXTBalance = async (): Promise<string> => {
    if (!provider) throw new Error('Provider not available');
    try {
      return await ethersRPC.getNEYXTBalance(provider);
    } catch (error) {
      console.error('Error getting NEYXT balance:', error);
      return '0';
    }
  };

  const getNativeBalance = async (): Promise<string> => {
    if (!provider) throw new Error('Provider not available');
    try {
      return await ethersRPC.getNetworkBalance(provider);
    } catch (error) {
      console.error('Error getting native balance:', error);
      return '0';
    }
  };

  const getTokenBalances = async (): Promise<TokenBalance> => {
    if (!provider) throw new Error('Provider not available');
    try {
      const [neyxt, native] = await Promise.all([
        getNEYXTBalance(),
        getNativeBalance(),
      ]);
      return { neyxt, native };
    } catch (error) {
      console.error('Error getting token balances:', error);
      return { neyxt: '0', native: '0' };
    }
  };

  const sendNEYXT = async (recipient: string, amount: string): Promise<string | Error> => {
    if (!provider) throw new Error('Provider not available');
    try {
      const result = await ethersRPC.sendToken(provider, recipient, amount);
      return result.hash || 'Transaction submitted';
    } catch (error) {
      console.error('Error sending NEYXT:', error);
      return error as Error;
    }
  };

  const sendNative = async (recipient: string, amount: string): Promise<string | Error> => {
    if (!provider) throw new Error('Provider not available');
    try {
      const result = await ethersRPC.sendTransaction(provider, recipient, amount);
      return result.hash || 'Transaction submitted';
    } catch (error) {
      console.error('Error sending native tokens:', error);
      return error as Error;
    }
  };

  const signMessage = async (): Promise<string> => {
    if (!provider) throw new Error('Provider not available');
    try {
      return await ethersRPC.signMessage(provider);
    } catch (error) {
      console.error('Error signing message:', error);
      return '';
    }
  };

  const ensureTokenApproval = async (spenderAddress: string, amount: string): Promise<boolean> => {
    if (!provider) throw new Error('Provider not available');
    try {
      const accounts = await ethersRPC.getAccounts(provider);
      const userAddress = accounts;
      
      // Convert ethers provider for the ensureApproval function
      const { BrowserProvider, parseUnits } = await import('ethers');
      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      
      const amountBigInt = parseUnits(amount, 18);
      return await ethersRPC.ensureApproval(signer, userAddress, spenderAddress, amountBigInt);
    } catch (error) {
      console.error('Error ensuring token approval:', error);
      return false;
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
    // Token operations
    getChainId,
    getTokenBalances,
    getNEYXTBalance,
    getNativeBalance,
    sendNEYXT,
    sendNative,
    signMessage,
    ensureTokenApproval,
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