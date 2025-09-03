import { useState, useEffect } from 'react';
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { useTokenService } from '../../hooks/useTokenService';
import { Button } from '../ui/Button';
import { Wallet, RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react';

export const TokenBalance = () => {
  const { isConnected, user, getAccounts } = useWeb3Auth();
  const { getTokenBalances, formatBalance, formatNativeBalance } = useTokenService();
  
  const [balances, setBalances] = useState({ neyxt: '0', native: '0', usdc: '0', weth: '0' });
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isConnected) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load wallet address
        const accounts = await getAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
        
        // Load token balances
        const tokenBalances = await getTokenBalances();
        setBalances(tokenBalances);
      } catch (err) {
        console.error('Error loading wallet data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load wallet data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isConnected]);

  const refreshBalances = async () => {
    if (!isConnected) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Refresh wallet address
      const accounts = await getAccounts();
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
      
      // Refresh token balances
      const tokenBalances = await getTokenBalances();
      setBalances(tokenBalances);
    } catch (err) {
      console.error('Error refreshing balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh balances');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = async () => {
    if (!walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600">Sign in to view your token balances and manage your NEYXT tokens.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Wallet className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Token Balances</h3>
            <p className="text-sm text-gray-600">
              {user?.name || user?.email || 'Connected User'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowBalances(!showBalances)}
            variant="outline"
            size="sm"
          >
            {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            onClick={refreshBalances}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Wallet Address */}
      {walletAddress && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Wallet Address</h4>
              <p className="text-sm text-gray-600 font-mono">
                {formatAddress(walletAddress)}
              </p>
            </div>
            <Button
              onClick={copyAddress}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Token Balances */}
      <div className="space-y-4">
        {/* NEYXT Token */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">NEYXT</p>
              <p className="text-sm text-gray-500">Founders Token</p>
            </div>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
            ) : showBalances ? (
              <p className="font-semibold text-gray-900">
                {formatBalance(balances.neyxt)} NEYXT
              </p>
            ) : (
              <p className="font-semibold text-gray-900">••••••</p>
            )}
          </div>
        </div>

        {/* Native Token */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">POL</p>
              <p className="text-sm text-gray-500">Native Token</p>
            </div>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
            ) : showBalances ? (
              <p className="font-semibold text-gray-900">
                {formatNativeBalance(balances.native)} POL
              </p>
            ) : (
              <p className="font-semibold text-gray-900">••••••</p>
            )}
          </div>
        </div>

        {/* USDC Token */}
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">$</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">USDC</p>
              <p className="text-sm text-gray-500">USD Coin</p>
            </div>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
            ) : showBalances ? (
              <p className="font-semibold text-gray-900">
                {formatBalance(balances.usdc, 2)} USDC
              </p>
            ) : (
              <p className="font-semibold text-gray-900">••••••</p>
            )}
          </div>
        </div>

        {/* wETH Token */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">Ξ</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">wETH</p>
              <p className="text-sm text-gray-500">Wrapped Ethereum</p>
            </div>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
            ) : showBalances ? (
              <p className="font-semibold text-gray-900">
                {formatBalance(balances.weth)} wETH
              </p>
            ) : (
              <p className="font-semibold text-gray-900">••••••</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex space-x-3">
        {/* TODO: Implement send buttons
        <Button
          onClick={() => handleSendNEYXT()}
          className="flex-1"
          disabled={isLoading}
        >
          Send NEYXT
        </Button>
        <Button
          onClick={() => handleSendPOL()}
          className="flex-1"
          disabled={isLoading}
        >
          Send POL
        </Button>
        */}
      </div>
    </div>
  );
}; 