import { useWeb3Auth } from './useWeb3Auth';
import ethersRPC from './ethersRPC';
import type { TokenBalance } from '../contexts/Web3AuthContext';

export const useTokenService = () => {
  const { provider, isConnected } = useWeb3Auth();

  const checkConnection = () => {
    if (!isConnected || !provider) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
  };

  const getChainId = async (): Promise<string> => {
    checkConnection();
    try {
      return await ethersRPC.getChainId(provider!);
    } catch (error) {
      console.error('Error getting chain ID:', error);
      throw new Error('Failed to get network information');
    }
  };

  const getNEYXTBalance = async (): Promise<string> => {
    checkConnection();
    try {
      return await ethersRPC.getNEYXTBalance(provider!);
    } catch (error) {
      console.error('Error getting NEYXT balance:', error);
      throw new Error('Failed to get NEYXT token balance');
    }
  };

  const getNativeBalance = async (): Promise<string> => {
    checkConnection();
    try {
      return await ethersRPC.getNetworkBalance(provider!);
    } catch (error) {
      console.error('Error getting native balance:', error);
      throw new Error('Failed to get native token balance');
    }
  };

  const getUSDCBalance = async (): Promise<string> => {
    checkConnection();
    try {
      return await ethersRPC.getUSDCBalance(provider!);
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      throw new Error('Failed to get USDC token balance');
    }
  };

  const getWETHBalance = async (): Promise<string> => {
    checkConnection();
    try {
      return await ethersRPC.getWETHBalance(provider!);
    } catch (error) {
      console.error('Error getting wETH balance:', error);
      throw new Error('Failed to get wETH token balance');
    }
  };

  const getTokenBalances = async (): Promise<TokenBalance> => {
    checkConnection();
    try {
      const [neyxt, native, usdc, weth] = await Promise.all([
        getNEYXTBalance(),
        getNativeBalance(),
        getUSDCBalance(),
        getWETHBalance(),
      ]);
      return { neyxt, native, usdc, weth };
    } catch (error) {
      console.error('Error getting token balances:', error);
      throw new Error('Failed to get token balances');
    }
  };

  const sendNEYXT = async (recipient: string, amount: string): Promise<string> => {
    checkConnection();
    if (!recipient || !amount) {
      throw new Error('Recipient address and amount are required');
    }
    
    try {
      const result = await ethersRPC.sendToken(provider!, recipient, amount);
      return result.hash || 'Transaction submitted';
    } catch (error) {
      console.error('Error sending NEYXT:', error);
      throw new Error('Failed to send NEYXT tokens');
    }
  };

  const sendNative = async (recipient: string, amount: string): Promise<string> => {
    checkConnection();
    if (!recipient || !amount) {
      throw new Error('Recipient address and amount are required');
    }
    
    try {
      const result = await ethersRPC.sendTransaction(provider!, recipient, amount);
      return result.hash || 'Transaction submitted';
    } catch (error) {
      console.error('Error sending native tokens:', error);
      throw new Error('Failed to send native tokens');
    }
  };

  const signMessage = async (): Promise<string> => {
    checkConnection();
    try {
      return await ethersRPC.signMessage(provider!);
    } catch (error) {
      console.error('Error signing message:', error);
      throw new Error('Failed to sign message');
    }
  };

  const ensureTokenApproval = async (spenderAddress: string, amount: string): Promise<boolean> => {
    checkConnection();
    if (!spenderAddress || !amount) {
      throw new Error('Spender address and amount are required');
    }
    
    try {
      const accounts = await ethersRPC.getAccounts(provider!);
      const userAddress = accounts;
      
      // Convert ethers provider for the ensureApproval function
      const ethers = await import('ethers');
      const ethersProvider = new ethers.BrowserProvider(provider!);
      const signer = await ethersProvider.getSigner();
      
      const amountBigInt = ethers.parseUnits(amount, 18);
      return await ethersRPC.ensureApproval(signer, userAddress, spenderAddress, amountBigInt);
    } catch (error) {
      console.error('Error ensuring token approval:', error);
      throw new Error('Failed to approve token spending');
    }
  };

  // Utility functions for UI
  const formatBalance = (balance: string, decimals: number = 4): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(decimals);
  };

  const formatNativeBalance = (balance: string): string => {
    return formatBalance(balance, 4); // Always 4 decimals for POL
  };

  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const isValidAmount = (amount: string): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };

  return {
    // Core token operations
    getChainId,
    getNEYXTBalance,
    getNativeBalance,
    getUSDCBalance,
    getWETHBalance,
    getTokenBalances,
    sendNEYXT,
    sendNative,
    signMessage,
    ensureTokenApproval,
    
    // Utility functions
    formatBalance,
    formatNativeBalance,
    isValidAddress,
    isValidAmount,
    
    // State
    isConnected,
  };
}; 