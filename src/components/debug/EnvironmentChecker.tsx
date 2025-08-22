// import { useState } from 'react';
import { useState } from 'react';
import config from '../../config/env';
import { NetworkIndicator } from '../ui/NetworkIndicator';
import { BalanceDebugger } from './BalanceDebugger';
import { NetworkMismatchWarning } from '../wallet/NetworkMismatchWarning';
import { FaucetLinks } from '../wallet/FaucetLinks';
import { BuyNeyxtModal } from '../wallet/BuyNeyxtModal';
import { emailService } from '../../services/emailService';
import { Server, Mail, CheckCircle, ShoppingCart } from 'lucide-react';

export const EnvironmentChecker = () => {
  const [showBuyFlowModal, setShowBuyFlowModal] = useState(false);
  
  // const [showAIChat, setShowAIChat] = useState(false);
  const handleTestEmail = async () => {
    try {
      const result = await emailService.sendTestEmail('giloppe@gmail.com');
      
      if (result.success) {
        alert('✅ Test welcome email sent successfully!');
      } else {
        alert(`❌ Failed to send welcome email: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestApprovalEmail = async () => {
    try {
      const result = await emailService.sendApprovalEmail({
        to: 'giloppe@gmail.com',
        userName: 'Test Founder'
      });
      
      if (result.success) {
        alert('✅ Test approval email sent successfully!');
      } else {
        alert(`❌ Failed to send approval email: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestBuyFlow = () => {
    setShowBuyFlowModal(true);
  };

  if (!config.isDevelopment) {
    return null; // Only show in development
  }

  return (
    <>
    <div className="fixed bottom-4 right-4 bg-slate-gray border border-teal-blue/30 rounded-lg shadow-lg p-4 text-xs max-w-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Server className="w-4 h-4 text-teal-blue" />
        <span className="font-medium text-soft-white">Development Debug</span>
      </div>
      
      {/* Environment Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-soft-white/70">Environment:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            config.isDevelopment 
              ? 'bg-princeton-orange/20 text-princeton-orange' 
              : 'bg-teal-blue/20 text-teal-blue'
          }`}>
            {config.isDevelopment ? 'DEV' : 'PROD'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-soft-white/70">Network:</span>
          <NetworkIndicator />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-soft-white/70">Database:</span>
          <span className="text-soft-white font-mono">
            {config.supabase.projectId ? config.supabase.projectId.slice(-8) : 'N/A'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-soft-white/70">Web3Auth:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            config.web3AuthNetwork === 'sapphire_devnet'
              ? 'bg-princeton-orange/20 text-princeton-orange'
              : 'bg-teal-blue/20 text-teal-blue'
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

      {/* Buy Flow Test */}
      <div className="border-t border-teal-blue/20 pt-4 mb-4">
        <button
          onClick={handleTestBuyFlow}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-teal-blue text-charcoal-black text-xs rounded hover:bg-teal-blue-600 transition-colors"
        >
          <ShoppingCart className="w-3 h-3" />
          <span>Test Buy Flow</span>
        </button>
      </div>

      {/* Email Test */}
      <div className="border-t border-teal-blue/20 pt-4 space-y-2">
        <button
          onClick={handleTestEmail}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-princeton-orange text-soft-white text-xs rounded hover:bg-princeton-orange-600 transition-colors"
        >
          <Mail className="w-3 h-3" />
          <span>Test Welcome Email</span>
        </button>
        
        <button
          onClick={handleTestApprovalEmail}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-teal-blue text-charcoal-black text-xs rounded hover:bg-teal-blue-600 transition-colors"
        >
          <CheckCircle className="w-3 h-3" />
          <span>Test Approval Email</span>
        </button>

        {/* AI Chat test button removed for now */}
      </div>
    </div>

    {/* Buy Flow Modal */}
    <BuyNeyxtModal 
      isOpen={showBuyFlowModal} 
      onClose={() => setShowBuyFlowModal(false)} 
    />
    
    {/* AI Profiling modal removed for now */}
    </>
  );
};

export default EnvironmentChecker; 