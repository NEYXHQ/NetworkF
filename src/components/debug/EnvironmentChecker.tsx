import config from '../../config/env';
import { NetworkIndicator } from '../ui/NetworkIndicator';
import { BalanceDebugger } from './BalanceDebugger';
import { NetworkMismatchWarning } from '../wallet/NetworkMismatchWarning';
import { FaucetLinks } from '../wallet/FaucetLinks';
import { Server, Mail } from 'lucide-react';

export const EnvironmentChecker = () => {
  const handleTestEmail = async () => {
    try {
      // Replace with your actual Supabase project URL
      const supabaseUrl = config.supabase.url;
      const functionUrl = `${supabaseUrl}/functions/v1/send-welcome-email`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify({
          to: 'giloppe@gmail.com',
          subject: 'Test Welcome Email',
        }),
      });
      
      if (response.ok) {
        alert('Test email sent successfully!');
      } else {
        const error = await response.text();
        alert(`Failed to send email: ${error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  if (!config.isDevelopment) {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-xs max-w-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Server className="w-4 h-4 text-blue-600" />
        <span className="font-medium">Development Debug</span>
      </div>
      
      {/* Environment Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Environment:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            config.isDevelopment 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {config.isDevelopment ? 'DEV' : 'PROD'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Network:</span>
          <NetworkIndicator />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Database:</span>
          <span className="text-gray-800 font-mono">
            {config.supabase.projectId ? config.supabase.projectId.slice(-8) : 'N/A'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Web3Auth:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            config.web3AuthNetwork === 'sapphire_devnet'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {config.web3AuthNetwork === 'sapphire_devnet' ? 'DEVNET' : 'MAINNET'}
          </span>
        </div>
      </div>

      {/* Network Mismatch Warning */}
      <div className="mb-4">
        <NetworkMismatchWarning />
      </div>

      {/* Faucet Links */}
      <div className="mb-4">
        <FaucetLinks />
      </div>

      {/* Balance Debugger */}
      <div className="mb-4">
        <BalanceDebugger />
      </div>

      {/* Email Test */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={handleTestEmail}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          <Mail className="w-3 h-3" />
          <span>Test Welcome Email</span>
        </button>
      </div>
    </div>
  );
};

export default EnvironmentChecker; 