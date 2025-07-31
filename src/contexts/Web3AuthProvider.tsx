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
        // Log environment information
        console.log('🚀 Wfounders Application Starting...');
        console.log('📊 Environment Information:');
        console.log(`   Environment: ${config.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
        console.log(`   Network: ${config.network.displayName}`);
        console.log(`   Chain ID: ${config.network.chainId}`);
        console.log(`   Web3Auth Network: ${config.web3AuthNetwork}`);
        console.log(`   Database Project ID: ${config.supabase.projectId ? config.supabase.projectId.slice(-8) : 'N/A'}`);
        console.log(`   NEYXT Contract: ${config.neyxtContractAddress.slice(0, 10)}...${config.neyxtContractAddress.slice(-8)}`);
        console.log('');

        if (!config.web3AuthClientId) {
          console.error('❌ Web3Auth Client ID not found');
          setIsLoading(false);
          return;
        }

        const web3authInstance = new Web3Auth({
          clientId: config.web3AuthClientId,
          web3AuthNetwork: config.network.features.isTestnet
            ? WEB3AUTH_NETWORK.SAPPHIRE_DEVNET 
            : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          sessionTime: 24 * 60 * 60, // 24 hours in seconds
          enableLogging: config.isDevelopment,
        });

        await web3authInstance.init();
        setWeb3auth(web3authInstance);

        if (web3authInstance.connected) {
          setProvider(web3authInstance.provider);
          const user = await web3authInstance.getUserInfo();
          setUser(user);
          
          // Log wallet information
          console.log('👤 User Connected:');
          console.log(`   Name: ${user.name || 'N/A'}`);
          console.log(`   Email: ${user.email || 'N/A'}`);
          console.log(`   Verifier ID: ${(user as UserInfo).verifierId || 'N/A'}`);
          console.log(`   Profile Image: ${user.profileImage ? 'Available' : 'Not available'}`);
          console.log('');
          
          // Auto-switch network on reconnection too
          if (web3authInstance.provider) {
            await autoSwitchNetwork(web3authInstance.provider);
          }
        } else {
          console.log('🔐 Web3Auth initialized - User not connected');
          console.log('');
        }
      } catch (error) {
        console.error('❌ Web3Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      console.log('❌ Web3Auth not initialized yet');
      return;
    }
    
    console.log('🔗 Connecting to Web3Auth...');
    const web3authProvider = await web3auth.connect();
    setProvider(web3authProvider);
    const user = await web3auth.getUserInfo();
    setUser(user);
    
    // Log wallet information
    console.log('✅ User Login Successful:');
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email || 'N/A'}`);
    console.log(`   Verifier ID: ${(user as UserInfo).verifierId || 'N/A'}`);
    console.log(`   Profile Image: ${user.profileImage ? 'Available' : 'Not available'}`);
    
    // Get and log wallet address
    try {
      const ethers = await import('ethers');
      if (!web3authProvider) {
        console.log('   Wallet Address: Unable to retrieve - No provider');
        return;
      }
      const ethersProvider = new ethers.BrowserProvider(web3authProvider);
      const accounts = await ethersProvider.listAccounts();
      if (accounts.length > 0) {
        console.log(`   Wallet Address: ${accounts[0].address}`);
        console.log(`   Network: ${config.network.displayName} (Chain ID: ${config.network.chainId})`);
      }
    } catch {
      console.log('   Wallet Address: Unable to retrieve');
    }
    console.log('');
    
    // Automatically switch to the correct network after login
    await autoSwitchNetwork(web3authProvider as IProvider | null);
  };

  const autoSwitchNetwork = async (provider: IProvider | null) => {
    if (!provider) {
      console.warn('⚠️ No provider available for network switching');
      return;
    }
    
    try {
      console.log('🔄 Checking and switching to correct network...');
      
      // Check current network
      const ethers = await import('ethers');
      if (!provider) {
        console.warn('⚠️ No provider available for network switching');
        return;
      }
      const ethersProvider = new ethers.BrowserProvider(provider);
      const network = await ethersProvider.getNetwork();
      const currentChainId = network.chainId.toString();
      
      console.log(`Current network: ${currentChainId}, Expected: ${config.network.chainId}`);
      
      if (currentChainId !== config.network.chainId) {
        console.log(`🔄 Auto-switching from Chain ${currentChainId} to ${config.network.displayName}...`);
        
        try {
          // Try to switch to the correct network
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: config.network.chainIdHex }],
          });
          console.log('✅ Network switched successfully!');
        } catch (switchError: unknown) {
          // If the network doesn't exist, add it first
          if (switchError && typeof switchError === 'object' && 'code' in switchError && switchError.code === 4902) {
            console.log('📝 Network not found, adding it...');
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: config.network.chainIdHex,
                chainName: config.network.displayName,
                nativeCurrency: config.network.nativeCurrency,
                rpcUrls: config.network.rpcUrls.default,
                blockExplorerUrls: config.network.blockExplorerUrls,
              }],
            });
            console.log('✅ Network added and switched successfully!');
          } else {
            console.warn('⚠️ Could not switch network automatically:', switchError);
          }
        }
        console.log('🏁 Auto-switch process completed');
      } else {
        console.log('✅ Already on correct network!');
      }
      console.log('🏁 Network check completed');
    } catch (error) {
      console.warn('⚠️ Error during automatic network switching:', error);
    }
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