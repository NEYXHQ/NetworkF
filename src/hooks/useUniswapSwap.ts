import { useState, useCallback, useEffect } from 'react';
import type { Eip1193Provider } from 'ethers';
import { uniswapService, type SwapQuote, type SwapParams } from '../services/uniswapService';
import { useWeb3Auth } from './useWeb3Auth';

interface SwapState {
  quote: SwapQuote | null;
  isLoadingQuote: boolean;
  isExecuting: boolean;
  txHash: string | null;
  error: string | null;
  usdcBalance: string;
  wfounderBalance: string;
}

export const useUniswapSwap = () => {
  const { provider, getAccounts, isConnected } = useWeb3Auth();
  const [state, setState] = useState<SwapState>({
    quote: null,
    isLoadingQuote: false,
    isExecuting: false,
    txHash: null,
    error: null,
    usdcBalance: '0',
    wfounderBalance: '0'
  });

  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Helper function to convert Web3Auth provider to ethers BrowserProvider
  const getEthersProvider = useCallback(async () => {
    if (!provider) return null;
    const { ethers } = await import('ethers');
    // Web3Auth's IProvider is compatible with ethers' Eip1193Provider interface
    return new ethers.BrowserProvider(provider as Eip1193Provider);
  }, [provider]);

  // Get user address when wallet is connected
  useEffect(() => {
    const getUserAddress = async () => {
      if (isConnected && provider) {
        try {
          const accounts = await getAccounts();
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);
          }
        } catch (error) {
          console.error('Error getting user address:', error);
          setUserAddress(null);
        }
      } else {
        setUserAddress(null);
      }
    };

    getUserAddress();
  }, [isConnected, provider, getAccounts]);

  // Load balances when user address changes
  useEffect(() => {
    const loadBalances = async () => {
      if (userAddress && provider) {
        try {
          const ethersProvider = await getEthersProvider();
          if (!ethersProvider) return;

          const [usdcBalance, wfounderBalance] = await Promise.all([
            uniswapService.getUsdcBalance(userAddress, ethersProvider),
            uniswapService.getWfounderBalance(userAddress, ethersProvider)
          ]);

          setState(prev => ({
            ...prev,
            usdcBalance,
            wfounderBalance
          }));
        } catch (error) {
          console.error('Error loading balances:', error);
        }
      }
    };

    loadBalances();
  }, [userAddress, provider, getEthersProvider]);

  // Get real-time quote for USDC amount
  const getQuote = useCallback(async (amountInUsdc: string, slippagePercentage: number = 1): Promise<SwapQuote | null> => {
    if (!provider || !amountInUsdc || amountInUsdc === '0') {
      setState(prev => ({ ...prev, quote: null, error: null }));
      return null;
    }

    setState(prev => ({ ...prev, isLoadingQuote: true, error: null }));

    try {
      // Validate amount
      const amount = parseFloat(amountInUsdc);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Check minimum amount (0.01 USDC)
      if (amount < 0.01) {
        throw new Error('Minimum amount is 0.01 USDC');
      }

      // Check user has enough balance
      const usdcBalance = parseFloat(state.usdcBalance);
      if (amount > usdcBalance) {
        throw new Error('Insufficient USDC balance');
      }

      const ethersProvider = await getEthersProvider();
      if (!ethersProvider) {
        throw new Error('Provider not available');
      }

      const quote = await uniswapService.getSwapQuote(amountInUsdc, ethersProvider, slippagePercentage, userAddress || undefined);

      setState(prev => ({
        ...prev,
        quote,
        isLoadingQuote: false,
        error: null
      }));

      return quote;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote';
      setState(prev => ({
        ...prev,
        quote: null,
        isLoadingQuote: false,
        error: errorMessage
      }));
      return null;
    }
  }, [provider, state.usdcBalance, getEthersProvider]);

  // Execute the swap
  const executeSwap = useCallback(async (params: SwapParams): Promise<boolean> => {
    if (!provider || !userAddress) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    // Prevent duplicate executions
    if (state.isExecuting) {
      console.warn('Swap already executing, ignoring duplicate call');
      return false;
    }

    console.log('Starting swap execution with params:', params);

    setState(prev => ({
      ...prev,
      isExecuting: true,
      error: null,
      txHash: null
    }));

    try {
      const ethersProvider = await getEthersProvider();
      if (!ethersProvider) {
        throw new Error('Provider not available');
      }

      // Prepare transaction
      const swapTx = await uniswapService.prepareSwapTransaction(params, userAddress, ethersProvider);

      console.log('Debug: About to send swap transaction:', {
        to: swapTx.to,
        dataLength: swapTx.data.length,
        value: swapTx.value,
        gasLimit: swapTx.gasLimit,
        gasPrice: swapTx.gasPrice,
        userAddress
      });

      // Get signer
      const signer = await ethersProvider.getSigner();

      // Send transaction
      const txResponse = await signer.sendTransaction({
        to: swapTx.to,
        data: swapTx.data,
        value: swapTx.value,
        gasLimit: swapTx.gasLimit,
        gasPrice: swapTx.gasPrice
      });

      console.log('Swap transaction sent:', txResponse.hash);

      setState(prev => ({
        ...prev,
        txHash: txResponse.hash,
        isExecuting: false
      }));

      // Wait for confirmation
      const receipt = await txResponse.wait();
      console.log('Swap transaction confirmed:', receipt);

      // Refresh balances after successful swap
      if (userAddress) {
        const [usdcBalance, wfounderBalance] = await Promise.all([
          uniswapService.getUsdcBalance(userAddress, ethersProvider),
          uniswapService.getWfounderBalance(userAddress, ethersProvider)
        ]);

        setState(prev => ({
          ...prev,
          usdcBalance,
          wfounderBalance
        }));
      }

      return true;

    } catch (error) {
      console.error('Error executing swap:', error);
      const errorMessage = error instanceof Error ? error.message : 'Swap execution failed';

      setState(prev => ({
        ...prev,
        isExecuting: false,
        error: errorMessage
      }));

      return false;
    }
  }, [provider, userAddress, getEthersProvider]);

  // Check if approval is needed (for future token swaps, not ETH)
  const checkApprovalNeeded = useCallback(async (
    tokenAddress: string,
    amountIn: string
  ): Promise<boolean> => {
    if (!provider || !userAddress) return false;

    try {
      const ethersProvider = await getEthersProvider();
      if (!ethersProvider) return true;

      return await uniswapService.checkApprovalNeeded(
        tokenAddress,
        userAddress,
        amountIn,
        ethersProvider
      );
    } catch (error) {
      console.error('Error checking approval:', error);
      return true; // Assume approval needed on error
    }
  }, [provider, userAddress, getEthersProvider]);

  // Execute approval transaction (for future token swaps)
  const executeApproval = useCallback(async (
    tokenAddress: string,
    amountIn: string
  ): Promise<boolean> => {
    if (!provider || !userAddress) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    try {
      const ethersProvider = await getEthersProvider();
      if (!ethersProvider) {
        throw new Error('Provider not available');
      }

      const approvalTx = await uniswapService.prepareApprovalTransaction(
        tokenAddress,
        amountIn,
        ethersProvider
      );

      const signer = await ethersProvider.getSigner();
      const txResponse = await signer.sendTransaction({
        to: approvalTx.to,
        data: approvalTx.data,
        value: approvalTx.value,
        gasLimit: approvalTx.gasLimit,
        gasPrice: approvalTx.gasPrice
      });

      console.log('Approval transaction sent:', txResponse.hash);
      await txResponse.wait();
      console.log('Approval transaction confirmed');

      return true;
    } catch (error) {
      console.error('Error executing approval:', error);
      const errorMessage = error instanceof Error ? error.message : 'Approval failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [provider, userAddress, getEthersProvider]);

  // Refresh balances manually
  const refreshBalances = useCallback(async () => {
    if (userAddress && provider) {
      try {
        const ethersProvider = await getEthersProvider();
        if (!ethersProvider) return;

        const [usdcBalance, wfounderBalance] = await Promise.all([
          uniswapService.getUsdcBalance(userAddress, ethersProvider),
          uniswapService.getWfounderBalance(userAddress, ethersProvider)
        ]);

        setState(prev => ({
          ...prev,
          usdcBalance,
          wfounderBalance
        }));
      } catch (error) {
        console.error('Error refreshing balances:', error);
      }
    }
  }, [userAddress, provider, getEthersProvider]);

  // Clear state
  const clearState = useCallback(() => {
    setState({
      quote: null,
      isLoadingQuote: false,
      isExecuting: false,
      txHash: null,
      error: null,
      usdcBalance: '0',
      wfounderBalance: '0'
    });
  }, []);

  // Clear only swap-related state (keep balances)
  const clearSwapState = useCallback(() => {
    setState(prev => ({
      ...prev,
      quote: null,
      isLoadingQuote: false,
      isExecuting: false,
      txHash: null,
      error: null
    }));
  }, []);

  return {
    // State
    quote: state.quote,
    isLoadingQuote: state.isLoadingQuote,
    isExecuting: state.isExecuting,
    txHash: state.txHash,
    error: state.error,
    usdcBalance: state.usdcBalance,
    wfounderBalance: state.wfounderBalance,
    userAddress,
    isConnected: isConnected && !!userAddress,

    // Actions
    getQuote,
    executeSwap,
    checkApprovalNeeded,
    executeApproval,
    refreshBalances,
    clearState,
    clearSwapState
  };
};