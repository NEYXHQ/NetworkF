import { useState, useEffect } from 'react';
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { useTokenService } from '../../hooks/useTokenService';
import { Button } from '../ui/Button';
import { FaucetLinks } from './FaucetLinks';
import { BalanceDebugger } from '../debug/BalanceDebugger';
import { NetworkMismatchWarning } from './NetworkMismatchWarning';
import config from '../../config/env';
import { Wallet, RefreshCw, Eye, EyeOff, ExternalLink } from 'lucide-react';

export const TokenBalance = () => {
  const { isConnected, user } = useWeb3Auth();
  const { getTokenBalances, formatBalance, formatNativeBalance } = useTokenService();
  
  const [balances, setBalances] = useState({ neyxt: '0', native: '0' });
  const [isLoading, setIsLoading] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;
    
    const loadBalances = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const tokenBalances = await getTokenBalances();
        setBalances(tokenBalances);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load balances');
        console.error('Error loading balances:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBalances();
  }, [isConnected]); // Only depend on isConnected

  const refreshBalances = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenBalances = await getTokenBalances();
      setBalances(tokenBalances);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balances');
      console.error('Error loading balances:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openBlockExplorer = (address?: string) => {
    if (!address || !config.network.blockExplorerUrls[0]) return;
    
    const url = `${config.network.blockExplorerUrls[0]}/address/${address}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-500">
          <Wallet className="mx-auto h-8 w-8 mb-2" />
          <p>Connect your wallet to view token balances</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Network Mismatch Warning */}
      <NetworkMismatchWarning />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Wallet className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Wallet Overview</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshBalances}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* User Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Account:</span> {user?.name || user?.email || 'Connected User'}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Network:</span> {config.network.displayName}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
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
              <p className="font-medium text-gray-900">NEYXT Token</p>
              <p className="text-sm text-gray-500">NetworkF2 Utility Token</p>
            </div>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 rounded h-4 w-16"></div>
            ) : showBalances ? (
              <p className="font-semibold text-gray-900">
                {formatBalance(balances.neyxt)} NEYXT
              </p>
            ) : (
              <p className="font-semibold text-gray-900">••••</p>
            )}
          </div>
        </div>

        {/* Native Token */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {config.network.nativeCurrency.symbol[0]}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{config.network.nativeCurrency.symbol}</p>
              <p className="text-sm text-gray-500">Native Token</p>
            </div>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 rounded h-4 w-16"></div>
            ) : showBalances ? (
              <p className="font-semibold text-gray-900">
                {formatNativeBalance(balances.native)} {config.network.nativeCurrency.symbol}
              </p>
            ) : (
              <p className="font-semibold text-gray-900">••••</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex space-x-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          disabled={!showBalances || parseFloat(balances.neyxt) === 0}
        >
          Send NEYXT
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          disabled={!showBalances || parseFloat(balances.native) === 0}
        >
          Send {config.network.nativeCurrency.symbol}
        </Button>
      </div>

             {/* Network Info */}
       <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
         <div className="flex items-center justify-between">
           <div>
             <p className="text-xs text-blue-800">
               <strong>Network:</strong> {config.network.displayName} (auto-detected)
             </p>
             <p className="text-xs text-blue-600 mt-1">
               Chain ID: {config.network.chainId} • {config.network.nativeCurrency.symbol} network
             </p>
           </div>
           <button
             onClick={() => openBlockExplorer()}
             className="text-blue-600 hover:text-blue-800 transition-colors"
             title="View on block explorer"
           >
             <ExternalLink className="w-3 h-3" />
           </button>
                  </div>
       </div>

       {/* Faucet Links for Testnet */}
       <div className="mt-4">
         <FaucetLinks />
       </div>

       {/* Debug Section */}
       <div className="mt-4">
         <BalanceDebugger />
       </div>
     </div>
   );
 }; 