// M5.1 - POST /api/execute with traditional gas payment (no paymaster)
// M5.2 - Basic swap execution using DEX aggregator APIs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// Token addresses for Polygon
const POLYGON_TOKENS = {
  weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
  usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
  neyxt: '0x6dcefF586744F3F1E637FE5eE45e0ff3880bb761', // NEYXT on Polygon
  pol: '0x0000000000000000000000000000000000001010', // Native POL token
};

// DEX Aggregator APIs for swap execution
const DEX_APIS = {
  oneinch: 'https://api.1inch.dev/swap/v6.0/137',
  paraswap: 'https://apiv5.paraswap.io',
  openocean: 'https://open-api.openocean.finance/v3/137'
};

// 1inch API v6 Swap Response Interface
interface OneinchSwapResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: number;
  };
}

// Execute request interface
interface ExecuteRequest {
  routeId: string;
  userAddress: string;
  payAsset: string;
  receiveAsset: string;
  amountIn: string;
  slippagePercentage?: number;
}

// Execute response interface
interface ExecuteResponse {
  txData: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
  };
  statusUrl: string;
  estimatedGas: string;
  route: {
    source: string;
    routeId: string;
  };
}

// Helper function to get token address from asset name
function getTokenAddress(asset: string): string {
  switch (asset.toUpperCase()) {
    case 'WETH':
    case 'ETH':
      return POLYGON_TOKENS.weth;
    case 'USDC':
      return POLYGON_TOKENS.usdc;
    case 'POL':
      return POLYGON_TOKENS.pol;
    case 'NEYXT':
      return POLYGON_TOKENS.neyxt;
    default:
      throw new Error(`Unsupported asset: ${asset}`);
  }
}

// Helper function to get token decimals
function getTokenDecimals(asset: string): number {
  switch (asset.toUpperCase()) {
    case 'USDC':
      return 6;
    case 'WETH':
    case 'ETH':
    case 'POL':
    case 'NEYXT':
      return 18;
    default:
      throw new Error(`Unsupported asset: ${asset}`);
  }
}

// Helper function to convert amount to smallest units
function convertToSmallestUnits(amount: string, asset: string): string {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  
  const decimals = getTokenDecimals(asset);
  return Math.floor(numAmount * Math.pow(10, decimals)).toString();
}

// Fetch swap transaction data from 1inch API
async function fetchSwapFrom1inch(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  fromAddress: string,
  slippage: number = 1
): Promise<OneinchSwapResponse> {
  const url = `${DEX_APIS.oneinch}/swap?src=${fromTokenAddress}&dst=${toTokenAddress}&amount=${amount}&from=${fromAddress}&slippage=${slippage}`;
  
  console.log('Fetching swap from 1inch v6:', url);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('1inch swap API error:', {
      status: response.status,
      statusText: response.statusText,
      url: url,
      errorText: errorText
    });
    throw new Error(`1inch swap API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('1inch swap result:', result);
  
  return result;
}

// QuickSwap Router Address on Polygon
const QUICKSWAP_ROUTER = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

// Build QuickSwap transaction using UniswapV2Router interface
async function getSwapTransaction(
  payAsset: string,
  receiveAsset: string,
  amountIn: string,
  userAddress: string,
  slippagePercentage: number = 1
): Promise<ExecuteResponse> {
  const fromTokenAddress = getTokenAddress(payAsset);
  const toTokenAddress = getTokenAddress(receiveAsset);
  const amountInSmallestUnits = convertToSmallestUnits(amountIn, payAsset);
  
  console.log('Building QuickSwap transaction:', {
    payAsset,
    receiveAsset,
    amountIn,
    userAddress,
    fromTokenAddress,
    toTokenAddress,
    amountInSmallestUnits,
    slippagePercentage
  });
  
  // Get quote first to calculate minimum amount out
  const quoteAmount = await getQuoteFromQuickSwap(fromTokenAddress, toTokenAddress, amountInSmallestUnits);
  
  // Calculate minimum amount out with slippage protection
  const slippageMultiplier = (100 - slippagePercentage) / 100;
  const amountOutMin = Math.floor(parseFloat(quoteAmount) * slippageMultiplier).toString();
  
  // Build the swap transaction data
  const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
  const path = [fromTokenAddress, toTokenAddress];
  
  // Encode the function call for swapExactTokensForTokens
  const functionSignature = 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)';
  const functionSelector = '0x38ed1739'; // First 4 bytes of keccak256(functionSignature)
  
  // Encode parameters (simplified - in production you'd use proper ABI encoding)
  const encodedParams = encodeSwapParams(amountInSmallestUnits, amountOutMin, path, userAddress, deadline);
  const txData = functionSelector + encodedParams;
  
  const routeId = `quickswap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const statusUrl = `/api/status?route_id=${routeId}`;
  
  return {
    txData: {
      to: QUICKSWAP_ROUTER,
      data: txData,
      value: '0', // ERC20 to ERC20 swap
      gasLimit: '300000', // Higher gas limit for DEX swaps
      gasPrice: '30000000000' // 30 gwei
    },
    statusUrl,
    estimatedGas: '300000',
    route: {
      source: 'QuickSwap',
      routeId
    }
  };
}

// Get quote from QuickSwap (simplified version - would need proper implementation)
async function getQuoteFromQuickSwap(fromToken: string, toToken: string, amountIn: string): Promise<string> {
  // This is a simplified version - in production you would:
  // 1. Call QuickSwap factory to get pair address
  // 2. Get reserves from the pair contract
  // 3. Calculate output using constant product formula
  
  console.log('Getting QuickSwap quote for:', { fromToken, toToken, amountIn });
  
  // For now, return a calculated estimate based on typical conversion rates
  // This should be replaced with actual QuickSwap contract calls
  const amountInNum = parseFloat(amountIn);
  
  // Rough conversion estimate (replace with real calculation)
  if (fromToken.toLowerCase() === POLYGON_TOKENS.usdc.toLowerCase()) {
    // USDC to NEYXT: assuming 1 USDC = ~100 NEYXT (adjust based on your tokenomics)
    return (amountInNum * 100 * 1e12).toString(); // Account for decimal difference (6->18)
  } else if (fromToken.toLowerCase() === POLYGON_TOKENS.weth.toLowerCase()) {
    // WETH to NEYXT: assuming 1 WETH = ~300,000 NEYXT (adjust based on your tokenomics)
    return (amountInNum * 300000).toString();
  }
  
  throw new Error('Unsupported token pair for QuickSwap quote');
}

// Encode swap parameters (simplified - use proper ABI encoding in production)
function encodeSwapParams(amountIn: string, amountOutMin: string, path: string[], to: string, deadline: number): string {
  // This is a very simplified encoding - in production you should use:
  // - ethers.js ABI encoding
  // - or web3.js ABI encoding
  // - or a proper encoding library
  
  console.warn('⚠️ Using simplified parameter encoding - implement proper ABI encoding for production');
  
  // Return empty data for now - this will cause the transaction to fail
  // which is what we want until proper implementation
  throw new Error('QuickSwap transaction encoding not yet implemented - needs proper ABI encoding');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== EXECUTE FUNCTION CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Current timestamp:', new Date().toISOString());
  console.log('====================================');

  // Execute endpoint
  if (req.method === 'POST') {
    try {
      // Parse request body
      const body = await req.json() as ExecuteRequest;
      const { routeId, userAddress, payAsset, receiveAsset, amountIn, slippagePercentage } = body;

      // Validate required parameters
      if (!routeId || !userAddress || !payAsset || !receiveAsset || !amountIn) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required parameters',
            message: 'routeId, userAddress, payAsset, receiveAsset, and amountIn are required' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Validate user address format
      if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid user address',
            message: 'User address must be a valid Ethereum address' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Validate assets
      if (receiveAsset.toUpperCase() !== 'NEYXT') {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid receive asset',
            message: 'Only NEYXT can be received' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      if (!['USDC', 'ETH', 'WETH'].includes(payAsset.toUpperCase())) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid pay asset',
            message: 'Only USDC, ETH, or WETH can be used for payment' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Validate amount
      const amountNum = parseFloat(amountIn);
      if (isNaN(amountNum) || amountNum <= 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid amount',
            message: 'Amount must be a positive number' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Check minimum amounts
      let minAmount = 0.01; // Default for USDC
      if (payAsset.toUpperCase() === 'ETH' || payAsset.toUpperCase() === 'WETH') {
        minAmount = 0.00001; // Much lower minimum for ETH
      }

      if (amountNum < minAmount) {
        return new Response(
          JSON.stringify({ 
            error: 'Amount too small',
            message: `Minimum purchase amount is ${minAmount} ${payAsset}` 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Get swap transaction data
      const response = await getSwapTransaction(
        payAsset,
        receiveAsset,
        amountIn,
        userAddress,
        slippagePercentage || 1
      );

      console.log('Final execute response:', response);

      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );

    } catch (error) {
      console.error('Execute endpoint error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          message: error.message || 'Unknown error occurred'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
  }

  // Method not allowed
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405 
    }
  );
});