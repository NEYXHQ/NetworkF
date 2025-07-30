import config from '../../config/env';
import { ExternalLink, Droplets } from 'lucide-react';
import { Button } from '../ui/Button';

export const FaucetLinks = () => {
  // Only show in development mode and if it's a testnet
  if (!config.isDevelopment || !config.network.features.isTestnet || !config.network.faucets?.length) {
    return null;
  }

  const openFaucet = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <Droplets className="w-4 h-4 text-yellow-600 mr-2" />
        <h4 className="text-sm font-medium text-yellow-800">
          Need Test Tokens?
        </h4>
      </div>
      
      <p className="text-xs text-yellow-700 mb-3">
        Get free {config.network.nativeCurrency.symbol} tokens for testing on {config.network.displayName}:
      </p>
      
      <div className="flex flex-wrap gap-2">
        {config.network.faucets.map((faucetUrl, index) => {
          const faucetName = new URL(faucetUrl).hostname.replace('www.', '');
          
          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => openFaucet(faucetUrl)}
              className="text-xs h-7 px-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              {faucetName}
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}; 