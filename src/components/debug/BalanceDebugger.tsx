import { useState } from 'react';
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { useTokenService } from '../../hooks/useTokenService';
import { Button } from '../ui/Button';
import config from '../../config/env';
import { Bug, Copy, ExternalLink } from 'lucide-react';

interface DebugInfo {
  timestamp: string;
  network: {
    name: string;
    chainId: string;
    isTestnet: boolean;
    neyxtContract: string;
    rpcUrls: string[];
    detectedChainId?: string;
    chainMatches?: boolean;
  };
  wallet: {
    address?: string;
  };
  balances: {
    native?: string;
    nativeSuccess?: boolean;
    neyxt?: string;
    neyxtSuccess?: boolean;
  };
  contract?: {
    address: string;
    hasCode: boolean;
    codeLength: number;
  };
  errors: string[];
}

export const BalanceDebugger = () => {
  const { isConnected, provider, getAccounts } = useWeb3Auth();
  const { getWFOUNDERBalance, getNativeBalance } = useTokenService();
  
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  const runDebug = async () => {
    if (!isConnected || !provider) {
      return;
    }

    setIsDebugging(true);
    const debug: DebugInfo = {
      timestamp: new Date().toISOString(),
      network: {
        name: config.network.displayName,
        chainId: config.network.chainId,
        isTestnet: config.network.features.isTestnet,
        neyxtContract: config.wfounderContractAddress,
        rpcUrls: config.network.rpcUrls.default,
      },
      wallet: {},
      balances: {},
      errors: []
    };

    try {
      // Get wallet address
      const accounts = await getAccounts();
      debug.wallet.address = accounts[0] || 'No address found';
      
      // Test RPC connectivity
      try {
        const ethers = await import('ethers');
        const ethersProvider = new ethers.BrowserProvider(provider);
        const network = await ethersProvider.getNetwork();
        debug.network.detectedChainId = network.chainId.toString();
        debug.network.chainMatches = network.chainId.toString() === config.network.chainId;
      } catch (error) {
        debug.errors.push(`RPC Error: ${error}`);
      }

      // Test native balance
      try {
        const nativeBalance = await getNativeBalance();
        debug.balances.native = nativeBalance;
        debug.balances.nativeSuccess = !nativeBalance.includes('Error');
      } catch (error) {
        debug.errors.push(`Native Balance Error: ${error}`);
      }

      // Test WFOUNDER balance
      try {
        const wfounderBalance = await getWFOUNDERBalance();
        debug.balances.neyxt = wfounderBalance;
        debug.balances.neyxtSuccess = !wfounderBalance.includes('Error');
      } catch (error) {
        debug.errors.push(`WFOUNDER Balance Error: ${error}`);
      }

      // Test contract existence
      if (config.wfounderContractAddress) {
        try {
          const ethers = await import('ethers');
          const ethersProvider = new ethers.BrowserProvider(provider);
          const code = await ethersProvider.getCode(config.wfounderContractAddress);
          debug.contract = {
            address: config.wfounderContractAddress,
            hasCode: code !== '0x',
            codeLength: code.length
          };
        } catch (error) {
          debug.errors.push(`Contract Check Error: ${error}`);
        }
      } else {
        debug.errors.push('No WFOUNDER contract address configured');
      }

    } catch (error) {
      debug.errors.push(`General Error: ${error}`);
    }

    setDebugInfo(debug);
    setIsDebugging(false);
  };

  const copyToClipboard = (text: string | undefined) => {
    if (text) navigator.clipboard.writeText(text);
  };

  const openExplorer = (address: string | undefined) => {
    if (!address) return;
    const url = `${config.network.blockExplorerUrls[0]}/address/${address}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 border rounded-lg p-4">
        <p className="text-sm text-gray-600">Connect wallet to debug balances</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Bug className="w-4 h-4 text-gray-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Balance Debugger</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runDebug}
          disabled={isDebugging}
        >
          {isDebugging ? 'Debugging...' : 'Run Debug'}
        </Button>
      </div>

      {debugInfo && (
        <div className="space-y-3">
          {/* Network Info */}
          <div className="bg-white rounded p-3">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Network</h4>
            <div className="text-xs space-y-1">
              <div>Name: {debugInfo.network.name}</div>
              <div>Chain ID: {debugInfo.network.chainId} 
                {debugInfo.network.detectedChainId && (
                  <span className={debugInfo.network.chainMatches ? 'text-green-600' : 'text-red-600'}>
                    {' '}(Detected: {debugInfo.network.detectedChainId})
                  </span>
                )}
              </div>
              <div>Testnet: {debugInfo.network.isTestnet ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="bg-white rounded p-3">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Wallet</h4>
            <div className="text-xs">
              <div className="flex items-center">
                Address: {debugInfo.wallet.address?.slice(0, 10)}...
                <button onClick={() => copyToClipboard(debugInfo.wallet.address)} className="ml-1">
                  <Copy className="w-3 h-3" />
                </button>
                <button onClick={() => openExplorer(debugInfo.wallet.address)} className="ml-1">
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          {debugInfo.contract && (
            <div className="bg-white rounded p-3">
              <h4 className="text-xs font-medium text-gray-700 mb-2">WFOUNDER Contract</h4>
              <div className="text-xs space-y-1">
                               <div className="flex items-center">
                 Address: {debugInfo.contract?.address?.slice(0, 10)}...
                 <button onClick={() => copyToClipboard(debugInfo.contract?.address)} className="ml-1">
                   <Copy className="w-3 h-3" />
                 </button>
                 <button onClick={() => openExplorer(debugInfo.contract?.address)} className="ml-1">
                   <ExternalLink className="w-3 h-3" />
                 </button>
               </div>
               <div className={debugInfo.contract?.hasCode ? 'text-green-600' : 'text-red-600'}>
                 Contract exists: {debugInfo.contract?.hasCode ? 'Yes' : 'No'}
               </div>
              </div>
            </div>
          )}

          {/* Balance Results */}
          <div className="bg-white rounded p-3">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Balance Results</h4>
            <div className="text-xs space-y-1">
              <div className={debugInfo.balances.nativeSuccess ? 'text-green-600' : 'text-red-600'}>
                POL: {debugInfo.balances.native}
              </div>
              <div className={debugInfo.balances.neyxtSuccess ? 'text-green-600' : 'text-red-600'}>
                WFOUNDER: {debugInfo.balances.neyxt}
              </div>
            </div>
          </div>

          {/* Errors */}
          {debugInfo.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h4 className="text-xs font-medium text-red-700 mb-2">Errors</h4>
              <div className="text-xs text-red-600 space-y-1">
                {debugInfo.errors.map((error: string, index: number) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 