import { useState, useEffect } from 'react';
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { Button } from '../ui/Button';
import config from '../../config/env';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const NetworkMismatchWarning = () => {
  const { provider, isConnected } = useWeb3Auth();
  const [detectedChainId, setDetectedChainId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkNetwork = async () => {
    if (!provider || !isConnected) return;
    
    setIsChecking(true);
    try {
      const ethers = await import('ethers');
      const ethersProvider = new ethers.BrowserProvider(provider);
      const network = await ethersProvider.getNetwork();
      setDetectedChainId(network.chainId.toString());
    } catch (error) {
      console.error('Error checking network:', error);
      setDetectedChainId(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      checkNetwork();
    }
  }, [isConnected]);

  const isWrongNetwork = detectedChainId && detectedChainId !== config.network.chainId;

  const switchNetwork = async () => {
    if (!provider) return;
    
    try {
      // Request to switch to the correct network
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: config.network.chainIdHex }],
      });
      
      // Recheck after switching
      setTimeout(checkNetwork, 1000);
    } catch (error: unknown) {
      // If the network doesn't exist, try to add it
      if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
        try {
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
          setTimeout(checkNetwork, 1000);
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      } else {
        console.error('Error switching network:', error);
      }
    }
  };

  if (!isConnected || !isWrongNetwork) {
    return null;
  }

  const getNetworkName = (chainId: string): string => {
    switch (chainId) {
      case '1': return 'Ethereum Mainnet';
      case '137': return 'Polygon Mainnet';
      case '80002': return 'Polygon Amoy Testnet';
      case '11155111': return 'Sepolia Testnet';
      default: return `Chain ${chainId}`;
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Wrong Network Detected
          </h4>
          <p className="text-xs text-red-700 mb-3">
            Your wallet is connected to <strong>{getNetworkName(detectedChainId!)}</strong> but 
            this app requires <strong>{config.network.displayName}</strong>.
            Please switch networks to see your correct balances.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={switchNetwork}
              className="text-xs h-7 px-3 border-red-300 text-red-700 hover:bg-red-100"
            >
              Switch to {config.network.displayName}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkNetwork}
              disabled={isChecking}
              className="text-xs h-7 px-3 text-red-600 hover:bg-red-100"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
              Recheck
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 