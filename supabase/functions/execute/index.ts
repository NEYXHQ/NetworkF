// M5.1 - POST /api/execute with traditional gas payment (no paymaster)
// M5.2 - Basic swap execution using QuickSwap Router

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// Token addresses for Polygon
const POLYGON_TOKENS = {
  weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
  usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
  wfounder: '0x6dcefF586744F3F1E637FE5eE45e0ff3880bb761', // WFOUNDER on Polygon
  pol: '0x0000000000000000000000000000000000001010', // Native POL token
};

// QuickSwap Router Address on Polygon
const QUICKSWAP_ROUTER = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

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
  // If approval is needed, this will be the approval transaction
  approvalTx?: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
  };
  // The main swap transaction
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
  // Approval info
  requiresApproval?: boolean;
  approvalToken?: string;
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
    case 'WFOUNDER':
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
    case 'WFOUNDER':
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

// Check if token approval is needed
async function checkApprovalNeeded(
  tokenAddress: string, 
  userAddress: string, 
  spenderAddress: string, 
  amount: string
): Promise<boolean> {
  // For native tokens (POL), no approval needed
  if (tokenAddress === POLYGON_TOKENS.pol) {
    return false;
  }

  try {
    // Get current allowance
    const methodId = '0xdd62ed3e'; // allowance(address,address)
    const encodedOwner = encodeAddress(userAddress);
    const encodedSpender = encodeAddress(spenderAddress);
    const data = methodId + encodedOwner + encodedSpender;

    const response = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: tokenAddress, data }, 'latest'],
        id: 1
      })
    });

    const result = await response.json();
    
    if (result.error) {
      console.warn('Failed to check allowance, assuming approval needed:', result.error);
      return true;
    }

    const allowance = BigInt(result.result || '0x0');
    const requiredAmount = BigInt(amount);
    
    console.log('Approval check:', {
      tokenAddress,
      userAddress,
      spenderAddress,
      currentAllowance: allowance.toString(),
      requiredAmount: requiredAmount.toString(),
      needsApproval: allowance < requiredAmount
    });

    return allowance < requiredAmount;
  } catch (error) {
    console.warn('Error checking allowance, assuming approval needed:', error);
    return true;
  }
}

// Create ERC20 approval transaction
function createApprovalTransaction(
  tokenAddress: string,
  spenderAddress: string,
  amount: string
): {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
} {
  // approve(address spender, uint256 amount)
  const methodId = '0x095ea7b3';
  const encodedSpender = encodeAddress(spenderAddress);
  const encodedAmount = encodeUint256(amount);
  const data = methodId + encodedSpender + encodedAmount;

  return {
    to: tokenAddress,
    data,
    value: '0x0',
    gasLimit: '0x15F90', // 90k gas for approval
    gasPrice: '0x0' // Will be set dynamically
  };
}



// Find optimal route path between tokens
async function findBestRoute(fromToken: string, toToken: string): Promise<string[]> {
  const WETH = POLYGON_TOKENS.weth;
  
  // Direct pair exists?
  try {
    await getPairAddress(fromToken, toToken);
    console.log('Direct pair found:', fromToken, '→', toToken);
    return [fromToken, toToken];
  } catch {
    console.log('No direct pair, trying via WETH...');
  }
  
  // Try route via WETH (most common intermediate token)
  try {
    if (fromToken.toLowerCase() !== WETH.toLowerCase() && toToken.toLowerCase() !== WETH.toLowerCase()) {
      // Check if both pairs exist: fromToken → WETH and WETH → toToken
      await getPairAddress(fromToken, WETH);
      await getPairAddress(WETH, toToken);
      console.log('Route via WETH found:', fromToken, '→', WETH, '→', toToken);
      return [fromToken, WETH, toToken];
    }
  } catch {
    console.log('Route via WETH not available');
  }
  
  throw new Error(`No route found between ${fromToken} and ${toToken}. Available routes: direct pair or via WETH.`);
}

// Calculate quote for multi-hop path
async function getQuoteForPath(path: string[], amountIn: string): Promise<string> {
  let currentAmount = amountIn;
  
  console.log('Calculating quote for path:', path, 'starting with:', currentAmount);
  
  // For each hop in the path
  for (let i = 0; i < path.length - 1; i++) {
    const tokenIn = path[i];
    const tokenOut = path[i + 1];
    
    console.log(`Hop ${i + 1}: ${tokenIn} → ${tokenOut}, amount: ${currentAmount}`);
    
    // Get quote for this hop
    currentAmount = await getQuoteFromQuickSwap(tokenIn, tokenOut, currentAmount);
    
    console.log(`Output from hop ${i + 1}: ${currentAmount}`);
  }
  
  return currentAmount;
}

// Build QuickSwap transaction using optimal routing
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
  
  console.log('Building QuickSwap transaction with routing:', {
    payAsset,
    receiveAsset,
    amountIn,
    userAddress,
    fromTokenAddress,
    toTokenAddress,
    amountInSmallestUnits,
    slippagePercentage
  });
  
  // Find the best route
  const path = await findBestRoute(fromTokenAddress, toTokenAddress);
  console.log('Optimal route found:', path);
  
  // Get quote for the full path
  const quoteAmount = await getQuoteForPath(path, amountInSmallestUnits);
  
  // Calculate minimum amount out with slippage protection
  const slippageMultiplier = (100 - slippagePercentage) / 100;
  const amountOutMin = Math.floor(parseFloat(quoteAmount) * slippageMultiplier).toString();
  
  console.log('Route calculation:', {
    path,
    amountIn: amountInSmallestUnits,
    expectedOut: quoteAmount,
    amountOutMin,
    slippagePercentage
  });
  
  // Check if approval is needed for the input token
  console.log('🔍 Checking approval for:', {
    fromTokenAddress,
    userAddress,
    router: QUICKSWAP_ROUTER,
    amount: amountInSmallestUnits,
    payAsset
  });
  
  const needsApproval = await checkApprovalNeeded(
    fromTokenAddress, 
    userAddress, 
    QUICKSWAP_ROUTER, 
    amountInSmallestUnits
  );
  
  console.log('✅ Approval check result:', needsApproval);

  let approvalTx;
  if (needsApproval) {
    console.log('Approval needed for token:', fromTokenAddress);
    approvalTx = createApprovalTransaction(
      fromTokenAddress,
      QUICKSWAP_ROUTER,
      amountInSmallestUnits
    );
  }
  
  // Build the swap transaction data
  const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
  
  // Encode the function call for swapExactTokensForTokens
  // swapExactTokensForTokens(uint256,uint256,address[],address,uint256)
  const functionSelector = '0x38ed1739'; // First 4 bytes of keccak256(functionSignature)
  
  // Encode parameters with the optimal path
  const encodedParams = encodeSwapParams(amountInSmallestUnits, amountOutMin, path, userAddress, deadline);
  const txData = functionSelector + encodedParams;
  
  const routeId = `quickswap-route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const statusUrl = `/api/status?route_id=${routeId}`;
  
  const response: ExecuteResponse = {
    txData: {
      to: QUICKSWAP_ROUTER,
      data: txData,
      value: '0', // ERC20 to ERC20 swap
      gasLimit: '400000', // Higher gas limit for multi-hop swaps
      gasPrice: '0' // Will be set dynamically by frontend
    },
    statusUrl,
    estimatedGas: '400000',
    route: {
      source: `QuickSwap-${path.length - 1}hop`,
      routeId
    },
    requiresApproval: needsApproval,
    approvalToken: needsApproval ? payAsset : undefined
  };

  if (approvalTx) {
    response.approvalTx = approvalTx;
  }

  return response;
}

// QuickSwap Factory and Router constants
const QUICKSWAP_FACTORY = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32';
const POLYGON_RPC = 'https://polygon-rpc.com';

// Get pair address from QuickSwap factory
async function getPairAddress(tokenA: string, tokenB: string): Promise<string> {
  const methodId = '0xe6a43905'; // getPair(address,address)
  const encodedTokenA = encodeAddress(tokenA);
  const encodedTokenB = encodeAddress(tokenB);
  const data = methodId + encodedTokenA + encodedTokenB;
  
  const response = await fetch(POLYGON_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{
        to: QUICKSWAP_FACTORY,
        data: data
      }, 'latest'],
      id: 1
    })
  });
  
  const result = await response.json();
  if (result.error) {
    throw new Error(`Failed to get pair address: ${result.error.message}`);
  }
  
  const pairAddress = '0x' + result.result.slice(-40); // Last 20 bytes as address
  console.log('Pair address for', tokenA, '-', tokenB, ':', pairAddress);
  
  if (pairAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error(`No pair exists for ${tokenA}/${tokenB}`);
  }
  
  return pairAddress;
}

// Get reserves from pair contract
async function getReserves(pairAddress: string): Promise<{ reserve0: string; reserve1: string }> {
  const methodId = '0x0902f1ac'; // getReserves()
  
  const response = await fetch(POLYGON_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{
        to: pairAddress,
        data: methodId
      }, 'latest'],
      id: 1
    })
  });
  
  const result = await response.json();
  if (result.error) {
    throw new Error(`Failed to get reserves: ${result.error.message}`);
  }
  
  // Parse the returned data: reserve0 (32 bytes) + reserve1 (32 bytes) + blockTimestampLast (32 bytes)
  const data = result.result.slice(2); // Remove 0x prefix
  const reserve0 = BigInt('0x' + data.slice(0, 64)).toString();
  const reserve1 = BigInt('0x' + data.slice(64, 128)).toString();
  
  console.log('Reserves:', { reserve0, reserve1 });
  return { reserve0, reserve1 };
}

// Calculate output amount using constant product formula
function calculateAmountOut(amountIn: string, reserveIn: string, reserveOut: string): string {
  const amountInBig = BigInt(amountIn);
  const reserveInBig = BigInt(reserveIn);
  const reserveOutBig = BigInt(reserveOut);
  
  // UniswapV2 formula: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
  // 997/1000 = 0.3% fee
  const amountInWithFee = amountInBig * BigInt(997);
  const numerator = amountInWithFee * reserveOutBig;
  const denominator = reserveInBig * BigInt(1000) + amountInWithFee;
  
  return (numerator / denominator).toString();
}

// Get quote from QuickSwap using real pair contracts
async function getQuoteFromQuickSwap(fromToken: string, toToken: string, amountIn: string): Promise<string> {
  console.log('Getting QuickSwap quote for:', { fromToken, toToken, amountIn });
  
  try {
    // Get pair address
    const pairAddress = await getPairAddress(fromToken, toToken);
    
    // Get reserves
    const { reserve0, reserve1 } = await getReserves(pairAddress);
    
    // Determine which token is token0 and token1 (QuickSwap sorts them)
    const token0 = fromToken.toLowerCase() < toToken.toLowerCase() ? fromToken : toToken;
    const isToken0Input = fromToken.toLowerCase() === token0.toLowerCase();
    
    // Calculate output amount
    const reserveIn = isToken0Input ? reserve0 : reserve1;
    const reserveOut = isToken0Input ? reserve1 : reserve0;
    
    const amountOut = calculateAmountOut(amountIn, reserveIn, reserveOut);
    
    console.log('QuickSwap quote calculation:', {
      amountIn,
      reserveIn,
      reserveOut,
      amountOut,
      isToken0Input
    });
    
    return amountOut;
    
  } catch (error) {
    console.error('Error getting QuickSwap quote:', error);
    throw new Error(`Failed to get QuickSwap quote: ${error.message}`);
  }
}

// ABI encoding utilities for QuickSwap router calls
function padLeft(str: string, length: number): string {
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
}

function encodeAddress(address: string): string {
  // Remove 0x prefix and pad to 32 bytes (64 hex chars)
  return padLeft(address.replace('0x', ''), 64);
}

function encodeUint256(value: string): string {
  // Convert to hex and pad to 32 bytes
  const hex = BigInt(value).toString(16);
  return padLeft(hex, 64);
}



// Encode swap parameters for swapExactTokensForTokens
function encodeSwapParams(amountIn: string, amountOutMin: string, path: string[], to: string, deadline: number): string {
  console.log('Encoding swap parameters:', { amountIn, amountOutMin, path, to, deadline });
  
  // swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)
  const encodedAmountIn = encodeUint256(amountIn);
  const encodedAmountOutMin = encodeUint256(amountOutMin);
  const encodedTo = encodeAddress(to);
  const encodedDeadline = encodeUint256(deadline.toString());
  
  // For the array, we need to handle dynamic array encoding
  const pathOffset = encodeUint256('160'); // Offset to where array data starts
  const pathLength = encodeUint256(path.length.toString());
  const pathData = path.map(addr => encodeAddress(addr)).join('');
  
  const result = encodedAmountIn + encodedAmountOutMin + pathOffset + encodedTo + encodedDeadline + pathLength + pathData;
  
  console.log('Encoded parameters:', result);
  return result;
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
      if (receiveAsset.toUpperCase() !== 'WFOUNDER') {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid receive asset',
            message: 'Only WFOUNDER can be received' 
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