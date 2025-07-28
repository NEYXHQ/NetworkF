import config from '../../config/env';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const NetworkIndicator = () => {
  const isTestnet = config.network === 'testnet';

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
      isTestnet 
        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
        : 'bg-green-100 text-green-800 border border-green-200'
    }`}>
      {isTestnet ? (
        <AlertCircle className="w-3 h-3 mr-1" />
      ) : (
        <CheckCircle className="w-3 h-3 mr-1" />
      )}
      {isTestnet ? 'Testnet Mode' : 'Mainnet Mode'}
      <span className="ml-1 opacity-75">
        (Chain {config.chainId})
      </span>
    </div>
  );
}; 