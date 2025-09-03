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
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { Server, Mail, CheckCircle, ShoppingCart, Database, Shield } from 'lucide-react';

export const EnvironmentChecker = () => {
  const { isConnected, getAccounts, provider } = useWeb3Auth();
  const [showBuyFlowModal, setShowBuyFlowModal] = useState(false);
  const [poolInfo, setPoolInfo] = useState<string>('');
  const [isLoadingPool, setIsLoadingPool] = useState(false);
  const [approvalInfo, setApprovalInfo] = useState<string>('');
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [pendingTxInfo, setPendingTxInfo] = useState<string>('');
  const [isLoadingPendingTx, setIsLoadingPendingTx] = useState(false);
  
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

      // Get current WETH price in USD from a reliable source
      let wethPriceUsd = 0;
      try {
        // Try CoinGecko API first
        const coingeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        if (coingeckoResponse.ok) {
          const coingeckoData = await coingeckoResponse.json();
          wethPriceUsd = coingeckoData.ethereum?.usd || 0;
        }
        
        // If CoinGecko fails, try alternative source
        if (!wethPriceUsd) {
          const alternativeResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
          if (alternativeResponse.ok) {
            const alternativeData = await alternativeResponse.json();
            wethPriceUsd = parseFloat(alternativeData.price);
          }
        }
        
        // If no price could be fetched, throw an error
        if (!wethPriceUsd) {
          throw new Error('Failed to fetch WETH price from all available sources');
        }
        
        console.log('WETH price fetched:', wethPriceUsd);
      } catch (error) {
        console.error('Failed to fetch WETH price from external APIs:', error);
        throw new Error(`Unable to get current WETH price: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Calculate NEYXT spot price in USD
      const neyxtSpotPriceUsd = wethPriceUsd / spotPrice;

      // Check if pool has low liquidity
      const poolValueUsd = totalValueWeth * wethPriceUsd;
      const liquidityWarning = poolValueUsd < 10 ? 
        `\n⚠️  WARNING: Pool has very low liquidity ($${poolValueUsd.toFixed(2)}). Trades will have extreme price impact!` : '';

      // Format the pool info
      const poolInfoText = `${networkInfo}✅ SUCCESS: Pool data retrieved from mainnet!

🏊 POOL DATA
=====================
💰 Spot Price: 1 WETH = ${spotPrice.toFixed(6)} NEYXT
💲 WETH Price: $${wethPriceUsd.toFixed(2)} USD
🪙 NEYXT Price: $${neyxtSpotPriceUsd.toFixed(6)} USD per token
💎 NEYXT Liquidity: ${liquidityNeyxt.toLocaleString()} NEYXT
💎 WETH Liquidity: ${liquidityWeth.toFixed(4)} WETH
💎 Total Value Locked: ${totalValueWeth.toFixed(4)} WETH
💎 Total Value Locked: $${poolValueUsd.toFixed(2)} USD${liquidityWarning}
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
        usdc: config.buyFlow.contracts.usdc || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        weth: config.buyFlow.contracts.weth || '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        neyxt: config.buyFlow.neyxtAddress || '0x6dcefF586744F3F1E637FE5eE45e0ff3880bb761',
        
        // Routers/Spenders
        quickswapRouter: config.buyFlow.contracts.quickswapRouter || '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
        // Add other potential spenders
        uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // If used
        oneinchRouter: '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch v5
        paraswapRouter: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57', // ParaSwap
      };

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
      const wethContract = new ethers.Contract(contracts.weth, ERC20_ABI, ethersProvider);
      const neyxtContract = new ethers.Contract(contracts.neyxt, ERC20_ABI, ethersProvider);

      // Get token symbols and decimals
      const [usdcSymbol, usdcDecimals, wethSymbol, wethDecimals, neyxtSymbol, neyxtDecimals] = await Promise.all([
        usdcContract.symbol(),
        usdcContract.decimals(),
        wethContract.symbol(), 
        wethContract.decimals(),
        neyxtContract.symbol(),
        neyxtContract.decimals()
      ]);

      // Get balances
      const [usdcBalance, wethBalance, neyxtBalance] = await Promise.all([
        usdcContract.balanceOf(userAddress),
        wethContract.balanceOf(userAddress),
        neyxtContract.balanceOf(userAddress)
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
${wethSymbol}: ${formatBalance(wethBalance, wethDecimals)}
${neyxtSymbol}: ${formatBalance(neyxtBalance, neyxtDecimals)}

🔐 APPROVAL STATUS
==================\n`;

      // Check approvals for each token against each router
      const tokens = [
        { name: usdcSymbol, address: contracts.usdc, contract: usdcContract, decimals: usdcDecimals },
        { name: wethSymbol, address: contracts.weth, contract: wethContract, decimals: wethDecimals },
        { name: neyxtSymbol, address: contracts.neyxt, contract: neyxtContract, decimals: neyxtDecimals }
      ];

      const spenders = [
        { name: 'QuickSwap Router', address: contracts.quickswapRouter, category: '🔄 DEX' },
        { name: '1inch Router', address: contracts.oneinchRouter, category: '🔗 Aggregator' },
        { name: 'ParaSwap Router', address: contracts.paraswapRouter, category: '🔗 Aggregator' },
        { name: 'Uniswap V2 Router', address: contracts.uniswapV2Router, category: '🔄 DEX' }
      ];

      for (const token of tokens) {
        approvalReport += `\n📊 ${token.name} (${token.address}):\n`;
        
        for (const spender of spenders) {
          try {
            const allowance = await token.contract.allowance(userAddress, spender.address);
            const allowanceFormatted = parseFloat(ethers.formatUnits(allowance, token.decimals));
            
            const status = allowanceFormatted > 0 
              ? `✅ ${allowanceFormatted.toFixed(6)} ${token.name}`
              : '❌ Not Approved';
              
            approvalReport += `  ${spender.category} ${spender.name}: ${status}\n`;
          } catch (error) {
            approvalReport += `  ${spender.category} ${spender.name}: ⚠️ Error checking\n`;
          }
        }
      }

      approvalReport += `\n📋 EXPLANATION
==============
✅ = Router has approval to spend tokens
❌ = No approval (will need approval transaction)
⚠️ = Error checking (router may not exist on this network)

🔄 DEX = Direct exchange protocols
🔗 Aggregator = Multi-DEX routing protocols

💡 TIP: QuickSwap Router is the main one used for NEYXT swaps.
If you see ❌ for USDC → QuickSwap Router, you'll need approval before swapping.`;

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

  const handleTestQuickSwapQuote = async () => {
    try {
      // Test the QuickSwap quote endpoint
      const testRequest = {
        payAsset: 'USDC' as const,
        payChain: 'polygon' as const,
        amountIn: '0.01', // 1 USDC
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
💵 Amount In: ${quoteData.amountIn} USDC
💲 USD Equivalent: $${quoteData.usdEquivalent || 'N/A'}
🪙 NEYXT Price (ETH): $${quoteData.neyxtPriceUsd || 'N/A'} per token
⛽ Gas in NEYXT: ${quoteData.fees.gasInNeyxtEst}
📉 Slippage: ${quoteData.slippageBps / 100}%
⏱️ Estimated Time: ${quoteData.estimatedTimeSec}s
⏰ TTL: ${quoteData.ttlSec}s
🔍 Sources: ${quoteData.sources.join(', ')}
📊 Price Impact: ${quoteData.priceImpact}
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

  // Temporarily enabled in production for debugging
  // if (!config.isDevelopment) {
  //   return null; // Only show in development
  // }

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
      </div>

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