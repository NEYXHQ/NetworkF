// import { useState } from 'react';
import { useState, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import config from '../../config/env';
import { NetworkIndicator } from '../ui/NetworkIndicator';
import { BalanceDebugger } from './BalanceDebugger';
import { NetworkMismatchWarning } from '../wallet/NetworkMismatchWarning';
import { FaucetLinks } from '../wallet/FaucetLinks';
import { BuyWfounderModal } from '../wallet/BuyWfounderModal';
import { emailService } from '../../services/emailService';
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { useAirdropService } from '../../hooks/useAirdropService';
import { Server, Mail, CheckCircle, ShoppingCart, Database, Shield, X, Gift } from 'lucide-react';

export const EnvironmentChecker = () => {
  const { isConnected, getAccounts, provider } = useWeb3Auth();
  const { claimAirdrop, checkAirdropEligibility, airdropEnabled, airdropAmount } = useAirdropService();
  const [isOpen, setIsOpen] = useState(false);
  const [showBuyFlowModal, setShowBuyFlowModal] = useState(false);
  const [poolInfo, setPoolInfo] = useState<string>('');
  const [isLoadingPool, setIsLoadingPool] = useState(false);
  const [approvalInfo, setApprovalInfo] = useState<string>('');
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [pendingTxInfo, setPendingTxInfo] = useState<string>('');
  const [isLoadingPendingTx, setIsLoadingPendingTx] = useState(false);
  const [cancelTxInfo, setCancelTxInfo] = useState<string>('');
  const [isLoadingCancelTx, setIsLoadingCancelTx] = useState(false);
  const [airdropInfo, setAirdropInfo] = useState<string>('');
  const [isTestingAirdrop, setIsTestingAirdrop] = useState(false);
  const [envInfo, setEnvInfo] = useState<string>('');
  const [rpcTestInfo, setRpcTestInfo] = useState<string>('');
  const [isTestingRpc, setIsTestingRpc] = useState(false);
  
  const debugPanelRef = useRef<HTMLDivElement>(null);
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && debugPanelRef.current && !debugPanelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  // const [showAIChat, setShowAIChat] = useState(false);
  
  const handleTestAirdrop = async () => {
    console.log('🎯 AIRDROP TEST: Starting airdrop test...');
    
    if (!isConnected) {
      console.warn('🎯 AIRDROP TEST: Wallet not connected');
      setAirdropInfo('❌ Wallet not connected. Please connect your wallet first.');
      return;
    }

    setIsTestingAirdrop(true);
    setAirdropInfo('');

    try {
      console.log('🎯 AIRDROP TEST: Checking eligibility...');
      
      // Check eligibility first
      const eligibility = await checkAirdropEligibility();
      console.log('🎯 AIRDROP TEST: Eligibility result:', eligibility);
      
      let testReport = `🎁 AIRDROP TEST RESULTS
======================
🌐 Network: ${config.network.displayName}
💰 Airdrop Amount: ${airdropAmount} WFOUNDER
✅ Airdrop Enabled: ${airdropEnabled ? 'Yes' : 'No'}

🔍 ELIGIBILITY CHECK
==================
✅ Eligible: ${eligibility.eligible ? 'Yes' : 'No'}`;

      if (!eligibility.eligible) {
        testReport += `\n❌ Reason: ${eligibility.reason}`;
        
        if (eligibility.existingClaim) {
          testReport += `\n📋 Existing Claim:
   - ID: ${eligibility.existingClaim.id}
   - Status: ${eligibility.existingClaim.status}
   - Amount: ${eligibility.existingClaim.tokenAmount} WFOUNDER`;
          
          if (eligibility.existingClaim.transactionHash) {
            testReport += `\n   - TX Hash: ${eligibility.existingClaim.transactionHash}`;
          }
        }
        
        setAirdropInfo(testReport);
        return;
      }

      // If eligible, attempt the claim
      console.log('🎯 AIRDROP TEST: User is eligible, attempting claim...');
      testReport += `\n\n⏳ ATTEMPTING CLAIM
===================
🚀 Starting airdrop claim process...
💾 Creating database record...
🔗 Calling blockchain...`;
      
      setAirdropInfo(testReport);

      const claimResult = await claimAirdrop();
      console.log('🎯 AIRDROP TEST: Claim result:', claimResult);
      
      // Add a small delay to ensure database updates are complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get updated claim status from database
      const finalClaim = await checkAirdropEligibility();
      console.log('🎯 AIRDROP TEST: Final claim status:', finalClaim);
      
      if (claimResult) {
        testReport += `\n\n✅ CLAIM SUCCESSFUL!
        
📋 FINAL STATUS
===============
🎉 Airdrop claim completed successfully
💰 ${airdropAmount} WFOUNDER tokens sent  
🔗 Check your wallet for the tokens
📊 Database record: COMPLETED`;
        
        if (finalClaim.existingClaim?.transactionHash) {
          testReport += `\n🔗 Transaction Hash: ${finalClaim.existingClaim.transactionHash}`;
        }
      } else {
        testReport += `\n\n❌ CLAIM FAILED!

📋 FINAL STATUS  
===============
💥 Airdrop claim failed
🔍 Check browser console for detailed error messages  
🗄️ Check Supabase logs for backend errors
📊 Database record: FAILED (for audit purposes)`;
        
        if (finalClaim.existingClaim?.errorMessage) {
          testReport += `\n⚠️  Error: ${finalClaim.existingClaim.errorMessage}`;
        }
      }
      
      // Update the display with final status
      setAirdropInfo(testReport);

    } catch (error) {
      console.error('🎯 AIRDROP TEST: Error during test:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAirdropInfo(`❌ Airdrop test failed: ${errorMessage}\n\nCheck console for detailed error logs.`);
    } finally {
      setIsTestingAirdrop(false);
    }
  };

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

  const handleShowEnvInfo = () => {
    const envReport = `🔧 ENVIRONMENT CONFIGURATION
============================
🌐 Network: ${config.network.displayName} (${config.network.chainId})
📋 Environment: ${config.isDevelopment ? 'Development' : 'Production'}
🔗 RPC URL: ${config.network.rpcUrls.default[0]}

📄 CONTRACT ADDRESSES
====================
🪙 WFOUNDER: ${config.buyFlow.wfounderAddress || '❌ NOT SET'}
💵 USDC: ${config.buyFlow.contracts.usdc || '❌ NOT SET'}
🏊 Pool: ${config.buyFlow.contracts.refPoolAddress || '❌ NOT SET'}
🔄 Router: ${config.buyFlow.contracts.quickswapRouter || '❌ NOT SET'}
🏭 Factory: ${config.buyFlow.contracts.quickswapFactory || '❌ NOT SET'}

🔗 SUPABASE CONFIGURATION
========================
📡 URL: ${config.supabase.url || '❌ NOT SET'}
🆔 Project ID: ${config.supabase.projectId || '❌ NOT SET'}
🔑 API Base: ${config.buyFlow.apiBaseUrl || '❌ NOT SET'}

⚙️ FEATURE FLAGS
================
💳 Fiat: ${config.buyFlow.enableFiat ? '✅ Enabled' : '❌ Disabled'}
⛽ Gas Sponsorship: ${config.buyFlow.enableGasSponsorship ? '✅ Enabled' : '❌ Disabled'}
🌉 Cross Chain: ${config.buyFlow.enableCrossChain ? '✅ Enabled' : '❌ Disabled'}

${config.network.features.isTestnet ? `
⚠️ TESTNET NOTES
================
• Some contracts may not exist on testnet
• Pool addresses might be different from mainnet
• Limited DeFi infrastructure available
• Consider testing core functionality first` : ''}`;

    setEnvInfo(envReport);
  };

  const handleTestRpcConnectivity = async () => {
    setIsTestingRpc(true);
    setRpcTestInfo('');

    try {
      const allRpcUrls = [
        config.network.rpcUrls.default[0],
        ...config.network.rpcUrls.public,
        ...config.network.rpcUrls.backup
      ].filter(Boolean);

      let testReport = `🔗 RPC CONNECTIVITY TEST
========================
🌐 Network: ${config.network.displayName} (Chain ID: ${config.network.chainId})
📡 Testing ${allRpcUrls.length} RPC endpoints...

`;

      const results = [];

      for (let i = 0; i < allRpcUrls.length; i++) {
        const rpcUrl = allRpcUrls[i];
        testReport += `⏳ Testing RPC ${i + 1}/${allRpcUrls.length}: ${rpcUrl}\n`;
        setRpcTestInfo(testReport);

        try {
          const testProvider = new ethers.JsonRpcProvider(rpcUrl);
          const startTime = Date.now();

          // Test basic connectivity
          const network = await testProvider.getNetwork();
          const blockNumber = await testProvider.getBlockNumber();
          const endTime = Date.now();

          const responseTime = endTime - startTime;

          results.push({
            url: rpcUrl,
            status: 'success',
            chainId: network.chainId.toString(),
            blockNumber,
            responseTime,
            category: i === 0 ? 'primary' : (i < config.network.rpcUrls.default.length + config.network.rpcUrls.public.length ? 'public' : 'backup')
          });

        } catch (error) {
          results.push({
            url: rpcUrl,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            category: i === 0 ? 'primary' : (i < config.network.rpcUrls.default.length + config.network.rpcUrls.public.length ? 'public' : 'backup')
          });
        }
      }

      // Generate final report
      testReport = `🔗 RPC CONNECTIVITY TEST RESULTS
=================================
🌐 Network: ${config.network.displayName} (Chain ID: ${config.network.chainId})
📡 Tested ${allRpcUrls.length} RPC endpoints

📊 RESULTS SUMMARY
==================
✅ Working: ${results.filter(r => r.status === 'success').length}
❌ Failed: ${results.filter(r => r.status === 'failed').length}

`;

      // Show detailed results
      results.forEach((result, index) => {
        if (result.status === 'success') {
          testReport += `
✅ RPC ${index + 1} (${result.category}): SUCCESS
   URL: ${result.url}
   Chain ID: ${result.chainId}
   Block: ${result.blockNumber}
   Response: ${result.responseTime}ms`;
        } else {
          testReport += `
❌ RPC ${index + 1} (${result.category}): FAILED
   URL: ${result.url}
   Error: ${result.error}`;
        }
      });

      const workingRpcs = results.filter(r => r.status === 'success');
      if (workingRpcs.length > 0) {
        const fastest = workingRpcs.reduce((prev, curr) =>
          (prev.responseTime || Infinity) < (curr.responseTime || Infinity) ? prev : curr
        );
        testReport += `

🚀 RECOMMENDATIONS
==================
✅ ${workingRpcs.length} RPC${workingRpcs.length > 1 ? 's' : ''} working properly
⚡ Fastest RPC: ${fastest.url} (${fastest.responseTime}ms)

${workingRpcs.length === results.length ?
  '🎉 All RPC endpoints are working!' :
  `⚠️ ${results.filter(r => r.status === 'failed').length} RPC${results.filter(r => r.status === 'failed').length > 1 ? 's' : ''} failed - but backups available`}`;
      } else {
        testReport += `

🚨 CRITICAL ISSUE
================
❌ ALL RPC endpoints failed!
🔍 This explains the JsonRpcProvider error
💡 Check internet connection and try again`;
      }

      setRpcTestInfo(testReport);

    } catch (error) {
      setRpcTestInfo(`❌ RPC connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingRpc(false);
    }
  };

  const handlePoolInfo = async () => {
    setIsLoadingPool(true);
    setPoolInfo('');

    try {
      // Use current environment configuration
      const contracts = {
        refPool: config.buyFlow.contracts.refPoolAddress,
        wfounder: config.buyFlow.wfounderAddress,
        usdc: config.buyFlow.contracts.usdc,
        rpcUrl: config.network.rpcUrls.default[0]
      };

      // Validate required environment variables
      const missingVars = [];
      if (!contracts.refPool) missingVars.push('VITE_ETHEREUM_REF_POOL_ADDRESS');
      if (!contracts.wfounder) missingVars.push('VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS');
      if (!contracts.usdc) missingVars.push('VITE_ETHEREUM_USDC_CONTRACT_ADDRESS');
      if (!contracts.rpcUrl) missingVars.push('Network RPC URL');

      if (missingVars.length > 0) {
        const errorInfo = `❌ ENVIRONMENT CONFIGURATION ERROR

🔍 Missing Required Environment Variables:
${missingVars.map(v => `• ${v}`).join('\n')}

🌐 Current Network: ${config.network.displayName}
📋 Environment: ${config.isDevelopment ? 'Development' : 'Production'}

💡 Solutions:
• Add missing environment variables to .env.development
• Check CLAUDE.md for required environment variables
• Verify contract deployments exist on ${config.network.displayName}

${config.network.features.isTestnet ?
`⚠️ TESTNET NOTE:
• Testnet pools may not exist
• You may need to deploy test contracts
• Consider using mainnet for pool testing` : ''}`;

        setPoolInfo(errorInfo);
        return;
      }

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

      // Show initial connection info
      let initialInfo = `🔗 CONNECTING TO: ${config.network.displayName}
📡 Trying RPC endpoints...
🏊 Pool: ${contracts.refPool}
🪙 WFOUNDER: ${contracts.wfounder}
💵 USDC: ${contracts.usdc}

📊 Testing RPC connections...\n\n`;

      setPoolInfo(initialInfo);

      // Try multiple RPC endpoints for better reliability
      let provider: ethers.JsonRpcProvider | null = null;
      let workingRpcUrl = '';

      const rpcUrls = [
        contracts.rpcUrl, // Primary from config
        ...config.network.rpcUrls.public, // Public backups
        ...config.network.rpcUrls.backup  // Backup endpoints
      ].filter(Boolean); // Remove any undefined/empty URLs

      // Try each RPC endpoint until we find one that works
      for (const rpcUrl of rpcUrls) {
        try {
          const testProvider = new ethers.JsonRpcProvider(rpcUrl);
          // Test the provider by getting the network
          await testProvider.getNetwork();
          provider = testProvider;
          workingRpcUrl = rpcUrl;
          break;
        } catch (error) {
          console.warn(`RPC endpoint failed: ${rpcUrl}`, error);
          continue;
        }
      }

      if (!provider) {
        throw new Error(`All RPC endpoints failed for ${config.network.displayName}. Tried: ${rpcUrls.join(', ')}`);
      }

      // Update network info with working RPC
      const networkInfo = `🔗 CONNECTING TO: ${config.network.displayName}
📡 RPC: ${workingRpcUrl} ✅
🏊 Pool: ${contracts.refPool}
🪙 WFOUNDER: ${contracts.wfounder}
💵 USDC: ${contracts.usdc}

📊 Fetching pool data...\n\n`;

      setPoolInfo(networkInfo);

      // First, let's check if the pool contract exists
      try {
        const poolCode = await provider.getCode(contracts.refPool);
        if (poolCode === '0x') {
          throw new Error(`Pool contract does not exist at address ${contracts.refPool} on ${config.network.displayName}`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('does not exist')) {
          throw error;
        }
        // If it's a different error (like network issues), continue and let the original error show
      }

      // Create contract instances
      const pairContract = new ethers.Contract(contracts.refPool, PAIR_ABI, provider);
      
      // Fetch pool data
      const [reserves, token0Address, token1Address] = await Promise.all([
        pairContract.getReserves(),
        pairContract.token0(),
        pairContract.token1(),
      ]);

      // Determine which token is WFOUNDER and which is USDC
      const isWfounderToken0 = token0Address.toLowerCase() === contracts.wfounder.toLowerCase();
      const isUsdcToken0 = token0Address.toLowerCase() === contracts.usdc.toLowerCase();
      const isWfounderToken1 = token1Address.toLowerCase() === contracts.wfounder.toLowerCase();
      const isUsdcToken1 = token1Address.toLowerCase() === contracts.usdc.toLowerCase();

      // Validate this is actually a WFOUNDER/USDC pair
      if (!((isWfounderToken0 && isUsdcToken1) || (isWfounderToken1 && isUsdcToken0))) {
        throw new Error(`Pool is not a WFOUNDER/USDC pair. Found tokens: ${token0Address}, ${token1Address}`);
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

      // Calculate spot price (WFOUNDER per USDC)
      const reserve0 = reserves[0];
      const reserve1 = reserves[1];
      const blockTimestampLast = reserves[2];

      let spotPrice, liquidityUsdc, liquidityWfounder;

      if (isWfounderToken0) {
        // WFOUNDER is token0, USDC is token1
        const token0Formatted = Number(ethers.formatUnits(reserve0, token0Decimals));
        const token1Formatted = Number(ethers.formatUnits(reserve1, token1Decimals));
        spotPrice = token0Formatted / token1Formatted;
        liquidityWfounder = token0Formatted;
        liquidityUsdc = token1Formatted;
      } else {
        // USDC is token0, WFOUNDER is token1
        const token0Formatted = Number(ethers.formatUnits(reserve0, token0Decimals));
        const token1Formatted = Number(ethers.formatUnits(reserve1, token1Decimals));
        spotPrice = token1Formatted / token0Formatted;
        liquidityUsdc = token0Formatted;
        liquidityWfounder = token1Formatted;
      }

      // Calculate total value locked in USD (since USDC ≈ $1)
      const totalValueUsd = liquidityUsdc + (liquidityWfounder / spotPrice);

      // Calculate WFOUNDER spot price in USD (USDC price per WFOUNDER)
      const wfounderSpotPriceUsd = 1 / spotPrice; // Since USDC ≈ $1

      // Check if pool has low liquidity
      const liquidityWarning = totalValueUsd < 10 ?
        `\n⚠️  WARNING: Pool has very low liquidity ($${totalValueUsd.toFixed(2)}). Trades will have extreme price impact!` : '';

      // Format the pool info
      const poolInfoText = `${networkInfo}✅ SUCCESS: Pool data retrieved from ${config.network.displayName}!

🏊 POOL DATA
=====================
💰 Spot Price: 1 USDC = ${spotPrice.toFixed(6)} WFOUNDER
💵 USDC Price: $1.00 USD (stablecoin)
🪙 WFOUNDER Price: $${wfounderSpotPriceUsd.toFixed(6)} USD per token
💎 WFOUNDER Liquidity: ${liquidityWfounder.toLocaleString()} WFOUNDER
💵 USDC Liquidity: ${liquidityUsdc.toFixed(2)} USDC
💎 Total Value Locked: $${totalValueUsd.toFixed(2)} USD${liquidityWarning}
⏰ Last Update: ${new Date(Number(blockTimestampLast) * 1000).toISOString()}
🔗 Block Number: ${Number(blockTimestampLast)}
📝 Token Details:
   Token0 (${token0Symbol}): ${token0Address}
   Token1 (${token1Symbol}): ${token1Address}
   WFOUNDER is Token${isWfounderToken0 ? '0' : '1'}
   USDC is Token${isUsdcToken0 ? '0' : '1'}

🎯 Pool Status: ✅ Pool data fetching working perfectly!
💡 Network: Using ${config.network.displayName} (${config.network.features.isTestnet ? 'Testnet' : 'Mainnet'}) configuration.`;

      setPoolInfo(poolInfoText);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      let errorText = `❌ Error fetching pool data from ${config.network.displayName}: ${errorMessage}\n\n`;

      // Check if this is an RPC provider error
      if (errorMessage.includes('JsonRpcProvider failed to detect network') ||
          errorMessage.includes('All RPC endpoints failed') ||
          errorMessage.includes('network connection') ||
          errorMessage.includes('could not detect network')) {
        errorText += `🔍 RPC PROVIDER ERROR DETECTED\n\n`;
        errorText += `⚠️ Issue with RPC endpoint connectivity.\n\n`;
        errorText += `📋 Common causes:\n`;
        errorText += `• Infura API key may be invalid or rate limited\n`;
        errorText += `• Network connectivity issues\n`;
        errorText += `• RPC endpoint is down or overloaded\n`;
        errorText += `• Wrong network configuration\n\n`;
        errorText += `💡 Solutions:\n`;
        errorText += `• Check internet connection\n`;
        errorText += `• Verify Infura API key in networks.ts\n`;
        errorText += `• Try again in a few minutes (rate limiting)\n`;
        errorText += `• Use alternative RPC endpoints\n\n`;
        errorText += `🔧 Debug info:\n`;
        errorText += `Primary RPC: ${config.network.rpcUrls.default[0]}\n`;
        errorText += `Backup RPCs available: ${config.network.rpcUrls.public.length + config.network.rpcUrls.backup.length}`;
      } else if (config.network.features.isTestnet) {
        errorText += `🔍 TESTNET LIMITATION DETECTED\n\n`;
        errorText += `⚠️ The pool address (${config.buyFlow.contracts.refPoolAddress}) likely doesn't exist on ${config.network.displayName}.\n\n`;
        errorText += `📋 Common causes on testnets:\n`;
        errorText += `• Pool contracts are deployed on mainnet only\n`;
        errorText += `• Different pool addresses for testnet vs mainnet\n`;
        errorText += `• Limited DeFi infrastructure on testnets\n`;
        errorText += `• Test tokens may not have established liquidity pools\n\n`;
        errorText += `💡 Solutions:\n`;
        errorText += `• Deploy a test pool on ${config.network.displayName}\n`;
        errorText += `• Use mainnet pool address for testing (read-only)\n`;
        errorText += `• Check if testnet-specific pool addresses exist\n`;
        errorText += `• Consider using a testnet with more DeFi infrastructure\n\n`;
        errorText += `🚀 For now, you can:\n`;
        errorText += `1. Test other functionality that doesn't require pools\n`;
        errorText += `2. Switch to production mode to test with mainnet pools\n`;
        errorText += `3. Deploy your own test pool on ${config.network.displayName}`;
      } else {
        errorText += `🔍 DIAGNOSIS: Error on ${config.network.displayName}\n\n`;
        errorText += `📋 Possible causes:\n`;
        errorText += `• RPC endpoint is down\n`;
        errorText += `• Contract addresses are incorrect\n`;
        errorText += `• Network congestion\n`;
        errorText += `• Pool contract issues\n\n`;
        errorText += `💡 Solutions:\n`;
        errorText += `• Check RPC endpoint status\n`;
        errorText += `• Verify contract addresses in environment\n`;
        errorText += `• Try again later\n`;
        errorText += `• Check if pool is still active`;
      }
      
      setPoolInfo(errorText);
    } finally {
      setIsLoadingPool(false);
    }
  };

  const handleCheckApprovals = async () => {
    if (!isConnected || !provider) {
      setApprovalInfo('❌ Wallet not connected. Please connect your wallet first.');
      return;
    }

    setIsLoadingApprovals(true);
    setApprovalInfo('');

    try {
      // Get user's wallet address
      const accounts = await getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      const userAddress = accounts[0];

      // Contract addresses based on current network
      const contracts = {
        // Tokens
        usdc: config.buyFlow.contracts.usdc,
        wfounder: config.buyFlow.wfounderAddress,

        // Routers/Spenders
        quickswapRouter: config.buyFlow.contracts.quickswapRouter,
        // Add other potential spenders (these may not exist on testnet)
        uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // If used
        oneinchRouter: '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch v5
        paraswapRouter: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57', // ParaSwap
      };

      // Validate required environment variables for token contracts
      const missingVars = [];
      if (!contracts.usdc) missingVars.push('VITE_ETHEREUM_USDC_CONTRACT_ADDRESS');
      if (!contracts.wfounder) missingVars.push('VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS');
      if (!contracts.quickswapRouter) missingVars.push('VITE_ETHEREUM_UNISWAP_ROUTER');

      if (missingVars.length > 0) {
        const errorInfo = `❌ ENVIRONMENT CONFIGURATION ERROR

🔍 Missing Required Environment Variables:
${missingVars.map(v => `• ${v}`).join('\n')}

🌐 Current Network: ${config.network.displayName}
📋 Environment: ${config.isDevelopment ? 'Development' : 'Production'}

💡 Solutions:
• Add missing environment variables to .env.development
• Check CLAUDE.md for required environment variables
• Verify token contracts exist on ${config.network.displayName}

${config.network.features.isTestnet ?
`⚠️ TESTNET NOTE:
• Some tokens may not be deployed on testnet
• Consider using testnet-specific token addresses` : ''}`;

        setApprovalInfo(errorInfo);
        return;
      }

      // ERC20 ABI for allowance and token info
      const ERC20_ABI = [
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function symbol() external view returns (string)',
        'function decimals() external view returns (uint8)',
        'function balanceOf(address account) external view returns (uint256)'
      ];

      // Create ethers provider
      const ethersProvider = new ethers.BrowserProvider(provider);

      // Token contracts
      const usdcContract = new ethers.Contract(contracts.usdc, ERC20_ABI, ethersProvider);
      const wfounderContract = new ethers.Contract(contracts.wfounder, ERC20_ABI, ethersProvider);

      // Get token symbols and decimals
      const [usdcSymbol, usdcDecimals, wfounderSymbol, wfounderDecimals] = await Promise.all([
        usdcContract.symbol(),
        usdcContract.decimals(),
        wfounderContract.symbol(),
        wfounderContract.decimals()
      ]);

      // Get balances
      const [usdcBalance, wfounderBalance] = await Promise.all([
        usdcContract.balanceOf(userAddress),
        wfounderContract.balanceOf(userAddress)
      ]);

      // Format balances
      const formatBalance = (balance: bigint, decimals: number) => {
        return parseFloat(ethers.formatUnits(balance, decimals)).toFixed(6);
      };

      let approvalReport = `🛡️ TOKEN APPROVAL TRACKER
========================
👤 Wallet: ${userAddress}
🌐 Network: ${config.network.displayName} (${config.network.chainId})

💰 TOKEN BALANCES
=================
${usdcSymbol}: ${formatBalance(usdcBalance, usdcDecimals)}
${wfounderSymbol}: ${formatBalance(wfounderBalance, wfounderDecimals)}

🔐 APPROVAL STATUS
==================\n`;

      // Check approvals for each token against each router
      const tokens = [
        { name: usdcSymbol, address: contracts.usdc, contract: usdcContract, decimals: usdcDecimals },
        { name: wfounderSymbol, address: contracts.wfounder, contract: wfounderContract, decimals: wfounderDecimals }
      ];

      const spenders = [
        { name: 'QuickSwap Router', address: contracts.quickswapRouter, category: '🔄 DEX', testnetAvailable: true },
        { name: '1inch Router', address: contracts.oneinchRouter, category: '🔗 Aggregator', testnetAvailable: false },
        { name: 'ParaSwap Router', address: contracts.paraswapRouter, category: '🔗 Aggregator', testnetAvailable: false },
        { name: 'Uniswap V2 Router', address: contracts.uniswapV2Router, category: '🔄 DEX', testnetAvailable: true }
      ];

      for (const token of tokens) {
        approvalReport += `\n📊 ${token.name} (${token.address}):\n`;
        
        for (const spender of spenders) {
          try {
            // Skip testnet-unavailable routers if on testnet
            if (config.network.features.isTestnet && !spender.testnetAvailable) {
              approvalReport += `  ${spender.category} ${spender.name}: ⏸️ Not available on testnet\n`;
              continue;
            }

            const allowance = await token.contract.allowance(userAddress, spender.address);
            const allowanceFormatted = parseFloat(ethers.formatUnits(allowance, token.decimals));

            const status = allowanceFormatted > 0
              ? `✅ ${allowanceFormatted.toFixed(6)} ${token.name}`
              : '❌ Not Approved';

            approvalReport += `  ${spender.category} ${spender.name}: ${status}\n`;
          } catch {
            approvalReport += `  ${spender.category} ${spender.name}: ⚠️ Error checking\n`;
          }
        }
      }

      approvalReport += `\n📋 EXPLANATION
==============
✅ = Router has approval to spend tokens
❌ = No approval (will need approval transaction)
⚠️ = Error checking (router may not exist on this network)
⏸️ = Not available on testnet

🔄 DEX = Direct exchange protocols
🔗 Aggregator = Multi-DEX routing protocols

💡 TIP: ${config.network.features.isTestnet ? 'DEX routers' : 'QuickSwap Router'} ${config.network.features.isTestnet ? 'are' : 'is'} the main ${config.network.features.isTestnet ? 'ones' : 'one'} used for WFOUNDER swaps.
If you see ❌ for USDC → Router, you'll need approval before swapping.`;

      setApprovalInfo(approvalReport);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setApprovalInfo(`❌ Error checking approvals: ${errorMessage}\n\nMake sure your wallet is connected and on the correct network.`);
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  const handleCheckPendingTransactions = async () => {
    if (!isConnected || !provider) {
      setPendingTxInfo('❌ Wallet not connected. Please connect your wallet first.');
      return;
    }

    setIsLoadingPendingTx(true);
    setPendingTxInfo('');

    try {
      // Get user's wallet address
      const accounts = await getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      const userAddress = accounts[0];

      // Create ethers provider and signer from Web3Auth
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const signerAddress = await signer.getAddress();

      // Get transaction counts
      const [latestNonce, pendingNonce] = await Promise.all([
        ethersProvider.getTransactionCount(userAddress, 'latest'),
        ethersProvider.getTransactionCount(userAddress, 'pending')
      ]);

      // Calculate pending transactions
      const pendingTxCount = pendingNonce - latestNonce;

      // Get current block number
      const currentBlock = await ethersProvider.getBlockNumber();

      // Get current gas price
      const gasPrice = await ethersProvider.getFeeData();

      let txReport = `⏳ PENDING TRANSACTIONS TRACKER
============================
👤 Wallet: ${userAddress}
🌐 Network: ${config.network.displayName} (${config.network.chainId})
📦 Current Block: ${currentBlock}

📊 TRANSACTION NONCES
====================
📋 Latest Nonce: ${latestNonce}
⏳ Pending Nonce: ${pendingNonce}
🔄 Pending TXs: ${pendingTxCount}

⛽ CURRENT GAS PRICES
====================
💰 Gas Price: ${gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') : 'N/A'} Gwei
💰 Max Fee: ${gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') : 'N/A'} Gwei
💰 Priority Fee: ${gasPrice.maxPriorityFeePerGas ? ethers.formatUnits(gasPrice.maxPriorityFeePerGas, 'gwei') : 'N/A'} Gwei

📈 TRANSACTION STATUS
====================`;

      if (pendingTxCount === 0) {
        txReport += `\n✅ No pending transactions
🚀 All transactions have been confirmed
🎯 Ready to submit new transactions`;
      } else {
        txReport += `\n⚠️ ${pendingTxCount} transaction(s) pending
⏰ Waiting for confirmation
🔄 New transactions may fail with nonce issues`;
        
        // Add warning about potential issues
        if (pendingTxCount > 3) {
          txReport += `\n\n🚨 HIGH PENDING COUNT WARNING
Too many pending transactions may cause:
• New transactions to fail
• Wallet to become unresponsive
• Need to wait for confirmations`;
        }
      }

      txReport += `\n\n📋 EXPLANATION
==============
📋 Latest Nonce = Last confirmed transaction
⏳ Pending Nonce = Next transaction to send
🔄 Pending TXs = Difference between the two

💡 TIPS:
• If pending > 0, wait before sending new transactions
• High gas prices may help speed up confirmations
• "Already known" errors often mean transactions are pending`;

      // Additional checks
      if (userAddress.toLowerCase() !== signerAddress.toLowerCase()) {
        txReport += `\n\n⚠️ ADDRESS MISMATCH WARNING:
Web3Auth Account: ${userAddress}
Signer Address: ${signerAddress}`;
      }

      setPendingTxInfo(txReport);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPendingTxInfo(`❌ Error checking pending transactions: ${errorMessage}\n\nMake sure your wallet is connected and on the correct network.`);
    } finally {
      setIsLoadingPendingTx(false);
    }
  };

  const handleCancelPendingTransaction = async () => {
    if (!isConnected || !provider) {
      setCancelTxInfo('❌ Wallet not connected. Please connect your wallet first.');
      return;
    }

    setIsLoadingCancelTx(true);
    setCancelTxInfo('');

    try {
      // Get user's wallet address
      const accounts = await getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      const userAddress = accounts[0];

      // Create ethers provider and signer from Web3Auth
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      // Get transaction counts
      const [latestNonce, pendingNonce] = await Promise.all([
        ethersProvider.getTransactionCount(userAddress, 'latest'),
        ethersProvider.getTransactionCount(userAddress, 'pending')
      ]);

      // Calculate pending transactions
      const pendingTxCount = pendingNonce - latestNonce;

      if (pendingTxCount === 0) {
        setCancelTxInfo('✅ No pending transactions to cancel.');
        return;
      }

      // Get current gas price and increase it by 20% to ensure replacement
      const feeData = await ethersProvider.getFeeData();
      const currentGasPrice = feeData.gasPrice || feeData.maxFeePerGas;
      if (!currentGasPrice) {
        throw new Error('Could not get current gas price');
      }
      
      // Increase gas price by 20% to ensure transaction replacement
      const higherGasPrice = (currentGasPrice * BigInt(120)) / BigInt(100);

      setCancelTxInfo(`🔄 CANCELING PENDING TRANSACTIONS
===============================
👤 Wallet: ${userAddress}
📋 Latest Nonce: ${latestNonce}
⏳ Pending Nonce: ${pendingNonce}
🔄 Pending TXs: ${pendingTxCount}

💰 Gas Price Strategy:
Current: ${ethers.formatUnits(currentGasPrice, 'gwei')} Gwei
Cancel: ${ethers.formatUnits(higherGasPrice, 'gwei')} Gwei (+20%)

🚀 Sending cancellation transactions...`);

      const cancelResults = [];

      // Send cancellation transactions for each pending nonce
      for (let nonce = latestNonce; nonce < pendingNonce; nonce++) {
        try {
          // Create 0 ETH transaction to self with higher gas price
          const cancelTx = {
            to: userAddress, // Send to self
            value: '0', // 0 ETH
            gasLimit: '21000', // Standard transfer gas limit
            gasPrice: higherGasPrice.toString(),
            nonce: nonce // Use the specific nonce to replace
          };

          console.log(`Sending cancellation transaction for nonce ${nonce}:`, cancelTx);
          
          const txResponse = await signer.sendTransaction(cancelTx);
          
          cancelResults.push({
            nonce,
            hash: txResponse.hash,
            status: 'sent'
          });

          console.log(`Cancellation tx sent for nonce ${nonce}:`, txResponse.hash);
          
        } catch (error) {
          console.error(`Failed to send cancellation for nonce ${nonce}:`, error);
          cancelResults.push({
            nonce,
            hash: null,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Update the info with results
      let resultReport = `🔄 CANCELLATION RESULTS
=======================
👤 Wallet: ${userAddress}
💰 Cancel Gas Price: ${ethers.formatUnits(higherGasPrice, 'gwei')} Gwei

📊 RESULTS:
`;

      cancelResults.forEach((result) => {
        if (result.status === 'sent') {
          resultReport += `\n✅ Nonce ${result.nonce}: ${result.hash}`;
        } else {
          resultReport += `\n❌ Nonce ${result.nonce}: ${result.error}`;
        }
      });

      resultReport += `\n\n📋 NEXT STEPS:
• Wait for cancellation transactions to confirm
• Check "Pending TXs" again in 30-60 seconds
• Original transactions should be replaced
• You can now send new transactions safely

⚠️ IMPORTANT:
• Only the first transaction to confirm wins
• Original transactions may still confirm if they have higher gas
• Check transaction status on block explorer`;

      setCancelTxInfo(resultReport);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setCancelTxInfo(`❌ Error canceling transactions: ${errorMessage}\n\nMake sure your wallet is connected and you have enough POL for gas fees.`);
    } finally {
      setIsLoadingCancelTx(false);
    }
  };

  const handleTestQuickSwapQuote = async () => {
    try {
      // Test the QuickSwap quote endpoint
      const testRequest = {
        payAsset: 'USDC' as const,
        payChain: 'polygon' as const,
        amountIn: '0.01', // 1 USDC
        receiveAsset: 'WFOUNDER' as const,
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
          'apikey': config.supabase.anonKey,
          'Authorization': `Bearer ${config.supabase.anonKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const quoteData = await response.json();
      
      const quoteInfo = `🧪 SWAP QUOTE TEST - SUCCESS!

📊 QUOTE DATA
=====================
🌐 Network: ${config.network.displayName}
🆔 Route ID: ${quoteData.routeId}
💰 Amount Out: ${quoteData.amountOutEst} WFOUNDER
💵 Amount In: ${quoteData.amountIn} USDC
💲 USD Equivalent: $${quoteData.usdEquivalent || 'N/A'}
🪙 WFOUNDER Price: $${quoteData.wfounderPriceUsd || 'N/A'} per token
⛽ Gas in WFOUNDER: ${quoteData.fees.gasInWfounderEst}
📉 Slippage: ${quoteData.slippageBps / 100}%
⏱️ Estimated Time: ${quoteData.estimatedTimeSec}s
⏰ TTL: ${quoteData.ttlSec}s
🔍 Sources: ${quoteData.sources.join(', ')}
📊 Price Impact: ${quoteData.priceImpact}
⛽ Gas Estimate: ${quoteData.gasEstimate}

✅ Swap API integration working on ${config.network.displayName}!`;

      setPoolInfo(quoteInfo);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const errorInfo = `🧪 SWAP QUOTE TEST - FAILED!

❌ Error: ${errorMessage}
🌐 Network: ${config.network.displayName}

🔍 This could mean:
• Swap API integration not yet implemented
• Network connectivity issues
• Invalid request parameters
• Supabase function errors
${config.network.features.isTestnet ? '• Testnet liquidity or DEX unavailability\n' : ''}
📋 Check:
• Function deployment status
• Network connectivity
• Request parameters
• Supabase function logs
${config.network.features.isTestnet ? '• Testnet DEX availability\n' : ''}`;

      setPoolInfo(errorInfo);
    }
  };

  // Temporarily enabled in production for debugging
  // if (!config.isDevelopment) {
  //   return null; // Only show in development
  // }

  return (
    <>
    {/* Toggle Button - always visible */}
    {!isOpen && (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-slate-gray border border-teal-blue/30 rounded-lg shadow-lg p-3 text-xs hover:bg-slate-gray-700 transition-colors z-50"
      >
        <Server className="w-5 h-5 text-teal-blue" />
      </button>
    )}
    
    {/* Debug Panel - expandable and scrollable */}
    {isOpen && (
      <div 
        ref={debugPanelRef}
        className="fixed bottom-4 right-4 bg-slate-gray border border-teal-blue/30 rounded-lg shadow-lg text-xs w-80 max-h-[80vh] flex flex-col z-50"
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-teal-blue/20">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-teal-blue" />
            <span className="font-medium text-soft-white">Development Debug</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-soft-white/50 hover:text-soft-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Environment Info */}
          <div className="space-y-3">
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
          onClick={handleShowEnvInfo}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors mt-2"
        >
          <span>⚙️</span>
          <span>Env Config</span>
        </button>

        <button
          onClick={handleTestRpcConnectivity}
          disabled={isTestingRpc}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          <span>🔗</span>
          <span>{isTestingRpc ? 'Testing...' : 'Test RPC'}</span>
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
          <span>Test Swap Quote</span>
        </button>

        <button
          onClick={handleCheckApprovals}
          disabled={isLoadingApprovals || !isConnected}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          <Shield className="w-3 h-3" />
          <span>{isLoadingApprovals ? 'Checking...' : 'Check Approvals'}</span>
        </button>

        <button
          onClick={handleCheckPendingTransactions}
          disabled={isLoadingPendingTx || !isConnected}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          <span>⏳</span>
          <span>{isLoadingPendingTx ? 'Checking...' : 'Pending TXs'}</span>
        </button>

        <button
          onClick={handleCancelPendingTransaction}
          disabled={isLoadingCancelTx || !isConnected}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          <span>🚫</span>
          <span>{isLoadingCancelTx ? 'Canceling...' : 'Cancel TXs'}</span>
        </button>

        <button
          onClick={handleTestAirdrop}
          disabled={isTestingAirdrop || !isConnected}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          <Gift className="w-3 h-3" />
          <span>{isTestingAirdrop ? 'Testing Airdrop...' : 'Test Airdrop'}</span>
        </button>
      </div>

      {/* Environment Info Display */}
      {envInfo && (
        <div className="border-t border-teal-blue/20 pt-4 mb-4">
          <div className="bg-charcoal-black/50 rounded p-3 text-xs font-mono whitespace-pre-wrap text-soft-white/90 max-h-64 overflow-y-auto">
            {envInfo}
          </div>
        </div>
      )}

      {/* RPC Test Info Display */}
      {rpcTestInfo && (
        <div className="border-t border-teal-blue/20 pt-4 mb-4">
          <div className="bg-charcoal-black/50 rounded p-3 text-xs font-mono whitespace-pre-wrap text-soft-white/90 max-h-64 overflow-y-auto">
            {rpcTestInfo}
          </div>
        </div>
      )}

      {/* Pool Info Display */}
      {poolInfo && (
        <div className="border-t border-teal-blue/20 pt-4 mb-4">
          <div className="bg-charcoal-black/50 rounded p-3 text-xs font-mono whitespace-pre-wrap text-soft-white/90 max-h-64 overflow-y-auto">
            {poolInfo}
          </div>
        </div>
      )}

      {/* Approval Info Display */}
      {approvalInfo && (
        <div className="border-t border-teal-blue/20 pt-4 mb-4">
          <div className="bg-charcoal-black/50 rounded p-3 text-xs font-mono whitespace-pre-wrap text-soft-white/90 max-h-64 overflow-y-auto">
            {approvalInfo}
          </div>
        </div>
      )}

      {/* Pending Transactions Info Display */}
      {pendingTxInfo && (
        <div className="border-t border-teal-blue/20 pt-4 mb-4">
          <div className="bg-charcoal-black/50 rounded p-3 text-xs font-mono whitespace-pre-wrap text-soft-white/90 max-h-64 overflow-y-auto">
            {pendingTxInfo}
          </div>
        </div>
      )}

      {/* Cancel Transactions Info Display */}
      {cancelTxInfo && (
        <div className="border-t border-teal-blue/20 pt-4 mb-4">
          <div className="bg-charcoal-black/50 rounded p-3 text-xs font-mono whitespace-pre-wrap text-soft-white/90 max-h-64 overflow-y-auto">
            {cancelTxInfo}
          </div>
        </div>
      )}

      {/* Airdrop Test Info Display */}
      {airdropInfo && (
        <div className="border-t border-teal-blue/20 pt-4 mb-4">
          <div className="bg-charcoal-black/50 rounded p-3 text-xs font-mono whitespace-pre-wrap text-soft-white/90 max-h-64 overflow-y-auto">
            {airdropInfo}
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
      </div>
    )}

    {/* Buy Flow Modal */}
    <BuyWfounderModal 
      isOpen={showBuyFlowModal} 
      onClose={() => setShowBuyFlowModal(false)} 
    />
    
    {/* AI Profiling modal removed for now */}
    </>
  );
};

export default EnvironmentChecker; 