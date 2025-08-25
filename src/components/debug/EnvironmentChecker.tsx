// import { useState } from 'react';
import { useState } from 'react';
import { ethers } from 'ethers';
import config from '../../config/env';
import { NetworkIndicator } from '../ui/NetworkIndicator';
import { BalanceDebugger } from './BalanceDebugger';
import { NetworkMismatchWarning } from '../wallet/NetworkMismatchWarning';
import { FaucetLinks } from '../wallet/FaucetLinks';
import { BuyNeyxtModal } from '../wallet/BuyNeyxtModal';
import { emailService } from '../../services/emailService';
import { Server, Mail, CheckCircle, ShoppingCart, Database } from 'lucide-react';

export const EnvironmentChecker = () => {
  const [showBuyFlowModal, setShowBuyFlowModal] = useState(false);
  const [poolInfo, setPoolInfo] = useState<string>('');
  const [isLoadingPool, setIsLoadingPool] = useState(false);
  
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

  const handlePoolInfo = async () => {
    setIsLoadingPool(true);
    setPoolInfo('');
    
    try {
      // QuickSwap v2 Pair ABI (minimal interface)
      const PAIR_ABI = [
        'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
        'function token0() external view returns (address)',
        'function token1() external view returns (address)',
      ];

      // ERC20 ABI (minimal interface)
      const ERC20_ABI = [
        'function decimals() external view returns (uint8)',
        'function symbol() external view returns (string)',
      ];

      // Always connect to mainnet pool since we don't have a dev pool
      // This allows us to test M3.2 functionality even in development
      const contracts = {
        refPool: '0x6B8A57addD24CAF494393D9E0bf38BC54F713833', // Mainnet pool (always)
        neyxt: '0x6dcefF586744F3F1E637FE5eE45e0ff3880bb761', // Mainnet NEYXT
        weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // Mainnet WETH
        rpcUrl: 'https://polygon-rpc.com' // Mainnet RPC
      };

      // Show network info first
      const networkInfo = `🔗 CONNECTING TO: MAINNET (Polygon) - Always
📡 RPC: ${contracts.rpcUrl}
🏊 Pool: ${contracts.refPool}
🪙 NEYXT: ${contracts.neyxt}
💎 WETH: ${contracts.weth}

📊 Fetching pool data...\n\n`;

      setPoolInfo(networkInfo);

      // Create provider
      const provider = new ethers.JsonRpcProvider(contracts.rpcUrl);
      
      // Create contract instances
      const pairContract = new ethers.Contract(contracts.refPool, PAIR_ABI, provider);
      
      // Fetch pool data
      const [reserves, token0Address, token1Address] = await Promise.all([
        pairContract.getReserves(),
        pairContract.token0(),
        pairContract.token1(),
      ]);

      // Determine which token is NEYXT and which is WETH
      const isNeyxtToken0 = token0Address.toLowerCase() === contracts.neyxt.toLowerCase();
      const isWethToken0 = token0Address.toLowerCase() === contracts.weth.toLowerCase();
      const isNeyxtToken1 = token1Address.toLowerCase() === contracts.neyxt.toLowerCase();
      const isWethToken1 = token1Address.toLowerCase() === contracts.weth.toLowerCase();

      // Validate this is actually a NEYXT/WETH pair
      if (!((isNeyxtToken0 && isWethToken1) || (isNeyxtToken1 && isWethToken0))) {
        throw new Error(`Pool is not a NEYXT/WETH pair. Found tokens: ${token0Address}, ${token1Address}`);
      }

      // Get token metadata
      const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, provider);
      const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, provider);

      const [token0Symbol, token0Decimals, token1Symbol, token1Decimals] = await Promise.all([
        token0Contract.symbol(),
        token0Contract.decimals(),
        token1Contract.symbol(),
        token1Contract.decimals(),
      ]);

      // Calculate spot price (NEYXT per WETH)
      const reserve0 = reserves[0];
      const reserve1 = reserves[1];
      const blockTimestampLast = reserves[2];

      let spotPrice, liquidityWeth, liquidityNeyxt;
      
      if (isNeyxtToken0) {
        // NEYXT is token0, WETH is token1
        const token0Formatted = Number(ethers.formatUnits(reserve0, token0Decimals));
        const token1Formatted = Number(ethers.formatUnits(reserve1, token1Decimals));
        spotPrice = token0Formatted / token1Formatted;
        liquidityNeyxt = token0Formatted;
        liquidityWeth = token1Formatted;
      } else {
        // WETH is token0, NEYXT is token1
        const token0Formatted = Number(ethers.formatUnits(reserve0, token0Decimals));
        const token1Formatted = Number(ethers.formatUnits(reserve1, token1Decimals));
        spotPrice = token1Formatted / token0Formatted;
        liquidityWeth = token0Formatted;
        liquidityNeyxt = token1Formatted;
      }

      // Calculate total value locked in WETH
      const totalValueWeth = liquidityWeth + (liquidityNeyxt / spotPrice);

      // Format the pool info
      const poolInfoText = `${networkInfo}✅ SUCCESS: Pool data retrieved from mainnet!

🏊 POOL DATA
=====================
💰 Spot Price: 1 WETH = ${spotPrice.toFixed(6)} NEYXT
💎 NEYXT Liquidity: ${liquidityNeyxt.toLocaleString()} NEYXT
💎 WETH Liquidity: ${liquidityWeth.toFixed(4)} WETH
💎 Total Value Locked: ${totalValueWeth.toFixed(4)} WETH
⏰ Last Update: ${new Date(Number(blockTimestampLast) * 1000).toISOString()}
🔗 Block Number: ${Number(blockTimestampLast)}
📝 Token Details:
   Token0 (${token0Symbol}): ${token0Address}
   Token1 (${token1Symbol}): ${token1Address}
   NEYXT is Token${isNeyxtToken0 ? '0' : '1'}
   WETH is Token${isWethToken0 ? '0' : '1'}

🎯 M3.2 Status: ✅ Pool data fetching working perfectly!
💡 Note: Connected to mainnet pool regardless of current environment for testing purposes.`;

      setPoolInfo(poolInfoText);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      let errorText = `❌ Error fetching pool data from mainnet: ${errorMessage}\n\n`;
      errorText += `🔍 DIAGNOSIS: Unexpected error on mainnet\n\n`;
      errorText += `📋 Possible causes:\n`;
      errorText += `• RPC endpoint is down\n`;
      errorText += `• Contract addresses are incorrect\n`;
      errorText += `• Network congestion\n`;
      errorText += `• Mainnet pool contract issues\n\n`;
      errorText += `💡 Solutions:\n`;
      errorText += `• Check RPC endpoint status\n`;
      errorText += `• Verify contract addresses\n`;
      errorText += `• Try again later\n`;
      errorText += `• Check if mainnet pool is still active`;
      
      setPoolInfo(errorText);
    } finally {
      setIsLoadingPool(false);
    }
  };

  const handleTestQuickSwapQuote = async () => {
    try {
      // Test the QuickSwap quote endpoint
      const testRequest = {
        payAsset: 'USDC' as const,
        payChain: 'polygon' as const,
        amountIn: '100', // 100 USDC
        receiveAsset: 'NEYXT' as const,
        receiveChain: 'polygon' as const,
        userAddress: '0x1234567890123456789012345678901234567890', // Test address
        slippagePercentage: 1.0, // 1% slippage
      };

      console.log('Testing QuickSwap quote with:', testRequest);
      console.log('Config values:', {
        apiBaseUrl: config.buyFlow.apiBaseUrl,
        supabaseUrl: config.supabase.url,
        resolvedSupabaseUrl: config.supabase.url,
      });

      // Call the quote endpoint directly
      const apiUrl = `${config.buyFlow.apiBaseUrl}/quote?${new URLSearchParams({
        payAsset: testRequest.payAsset,
        amountIn: testRequest.amountIn,
        receiveAsset: testRequest.receiveAsset,
        userAddress: testRequest.userAddress,
        slippagePercentage: testRequest.slippagePercentage.toString(),
      })}`;

      console.log('Calling API URL:', apiUrl);

      // Include Supabase anon key for authentication
      const response = await fetch(apiUrl, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZXBvaXZocW51cnhta2dpb2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjEwMzYsImV4cCI6MjA2OTQzNzAzNn0.f_GUBRAHJypHPXXOD8JAW7okAuhPUpQDvfFl9_JqK4Q',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZXBvaXZocW51cnhta2dpb2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjEwMzYsImV4cCI6MjA2OTQzNzAzNn0.f_GUBRAHJypHPXXOD8JAW7okAuhPUpQDvfFl9_JqK4Q`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const quoteData = await response.json();
      
      const quoteInfo = `🧪 QUICKSWAP QUOTE TEST - SUCCESS!

📊 QUOTE DATA
=====================
🆔 Route ID: ${quoteData.routeId}
💰 Amount Out: ${quoteData.amountOutEst} NEYXT
💵 Price: ${quoteData.price}
⛽ Gas in NEYXT: ${quoteData.fees.gasInNeyxtEst}
📉 Slippage: ${quoteData.slippageBps / 100}%
⏱️ Estimated Time: ${quoteData.estimatedTimeSec}s
⏰ TTL: ${quoteData.ttlSec}s
🔍 Sources: ${quoteData.sources.join(', ')}
📊 Price Impact: ${quoteData.priceImpact}%
⛽ Gas Estimate: ${quoteData.gasEstimate}

✅ M4 Implementation: QuickSwap API integration working!`;

      setPoolInfo(quoteInfo);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const errorInfo = `🧪 QUICKSWAP QUOTE TEST - FAILED!

❌ Error: ${errorMessage}

🔍 This could mean:
• QuickSwap API integration not yet implemented
• Network connectivity issues
• Invalid request parameters
• Supabase function errors

📋 Check:
• Function deployment status
• Network connectivity
• Request parameters
• Supabase function logs`;

      setPoolInfo(errorInfo);
    }
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
        
        <button
          onClick={handlePoolInfo}
          disabled={isLoadingPool}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-princeton-orange text-soft-white text-xs rounded hover:bg-princeton-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          <Database className="w-3 h-3" />
          <span>{isLoadingPool ? 'Loading...' : 'Pool Info'}</span>
        </button>

        <button
          onClick={handleTestQuickSwapQuote}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors mt-2"
        >
          <span>🧪</span>
          <span>Test QuickSwap Quote</span>
        </button>
      </div>

      {/* Pool Info Display */}
      {poolInfo && (
        <div className="border-t border-teal-blue/20 pt-4 mb-4">
          <div className="bg-charcoal-black/50 rounded p-3 text-xs font-mono whitespace-pre-wrap text-soft-white/90 max-h-64 overflow-y-auto">
            {poolInfo}
          </div>
        </div>
      )}

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