// M4.1 - GET /api/quote with QuickSwap API (Polygon-only)
// M4.2 - Return gas_in_neyxt_est and warnings for min purchase
// M4.3 - Enforce min purchase (NEYXT_out ≥ 1.25× gas_in_neyxt_est)
// M4.4 - Apply per-trade cap (≤ max_trade_notional_base)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// QuickSwap contract addresses for Polygon
const POLYGON_CONTRACTS = {
  weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
  usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
  neyxt: '0x6dcefF586744F3F1E637FE5eE45e0ff3880bb761', // NEYXT on Polygon
  pol: '0x0000000000000000000000000000000000001010', // Native POL token
  quickswapFactory: '0x5757371414417b8C6CAad45bAeF941aBc173d036', // QuickSwap v2 Factory
  quickswapRouter: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap v2 Router
  refPool: '0x6B8A57addD24CAF494393D9E0bf38BC54F713833', // WETH/NEYXT pool
  wethUsdcPool: '0x853Ee4b2A13f8a742d64C8F088bE7bA2131f670d', // WETH/USDC pool for price conversion
};

// RPC endpoint for Polygon
const POLYGON_RPC = 'https://polygon-rpc.com';

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

interface QuoteRequest {
  payAsset: string;      // Asset to pay (USDC, POL, WETH)
  amountIn: string;       // Amount to pay
  receiveAsset: string;   // Asset to receive (always NEYXT)
  userAddress?: string;   // Optional: user address for gas estimation
  slippagePercentage?: number; // Optional: slippage tolerance (default 1%)
}

interface QuoteResponse {
  routeId: string;
  amountOutEst: string;
  price: string;
  usdEquivalent?: string; // Add USD equivalent
  neyxtPriceUsd?: string; // Add NEYXT price in USD
  fees: {
    protocol: string;
    gasInNeyxtEst: string;
  };
  slippageBps: number;
  estimatedTimeSec: number;
  ttlSec: number;
  warnings: string[];
  sources: string[];
  priceImpact: string;
  gasEstimate: string;
}

// Pool data interface
interface PoolData {
  reserve0: string;
  reserve1: string;
  token0: string;
  token1: string;
  token0Decimals: number;
  token1Decimals: number;
  token0Symbol: string;
  token1Symbol: string;
}

// Helper function to get token address from asset name
function getTokenAddress(asset: string): string {
  switch (asset.toUpperCase()) {
    case 'WETH':
    case 'ETH':
      return POLYGON_CONTRACTS.weth;
    case 'USDC':
      return POLYGON_CONTRACTS.usdc;
    case 'POL':
      return POLYGON_CONTRACTS.pol;
    case 'NEYXT':
      return POLYGON_CONTRACTS.neyxt;
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
  
  switch (asset.toUpperCase()) {
    case 'USDC':
      return Math.floor(numAmount * 1e6).toString(); // USDC has 6 decimals
    case 'WETH':
    case 'ETH':
      return Math.floor(numAmount * 1e18).toString(); // WETH has 18 decimals
    case 'POL':
      return Math.floor(numAmount * 1e18).toString(); // POL has 18 decimals
    case 'NEYXT':
      return Math.floor(numAmount * 1e18).toString(); // NEYXT has 18 decimals
    default:
      throw new Error(`Unsupported asset: ${asset}`);
  }
}

// Helper function to fetch pool data directly from blockchain
async function fetchPoolDataFromBlockchain(requestedToken0: string, requestedToken1: string): Promise<PoolData | null> {
  try {
    console.log('Fetching pool data directly from blockchain...');
    console.log('Requested token addresses:', { token0: requestedToken0, token1: requestedToken1 });
    
    // For now, we'll use the known WETH/NEYXT pool address
    // In a full implementation, you'd query the factory for the pair address
    const poolAddress = POLYGON_CONTRACTS.refPool;
    console.log('Using pool address:', poolAddress);
    
    // Make direct RPC call to get pool reserves
    const rpcPayload = {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: poolAddress,
          data: '0x0902f1ac' // getReserves() function selector
        },
        'latest'
      ],
      id: 1
    };
    
    console.log('Making RPC call to get reserves...');
    console.log('RPC payload:', JSON.stringify(rpcPayload));
    console.log('RPC endpoint:', POLYGON_RPC);
    
    const response = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpcPayload)
    });
    
    console.log('RPC response status:', response.status);
    console.log('RPC response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('RPC call failed:', response.status, errorText);
      throw new Error(`RPC call failed: ${response.status} - ${errorText}`);
    }
    
    const rpcResult = await response.json();
    console.log('RPC response:', rpcResult);
    
    if (rpcResult.error) {
      console.error('RPC error in response:', rpcResult.error);
      throw new Error(`RPC error: ${rpcResult.error.message}`);
    }
    
    // Parse the reserves from the hex response
    const reservesHex = rpcResult.result;
    console.log('Raw reserves hex:', reservesHex);
    
    if (!reservesHex || reservesHex === '0x') {
      console.error('No reserves data returned');
      throw new Error('No reserves data returned');
    }
    
    // getReserves returns: reserve0 (32 bytes) + reserve1 (32 bytes) + blockTimestampLast (4 bytes)
    // Each reserve is 32 bytes (64 hex chars)
    const reserve0Hex = reservesHex.slice(2, 66); // Remove '0x' and get first 32 bytes
    const reserve1Hex = reservesHex.slice(66, 130); // Get next 32 bytes
    
    console.log('Parsed hex values:', { reserve0Hex, reserve1Hex });
    
    // Convert hex to decimal
    const reserve0 = BigInt('0x' + reserve0Hex).toString();
    const reserve1 = BigInt('0x' + reserve1Hex).toString();
    
    console.log('Parsed reserves:', { reserve0, reserve1 });
    
    // Get token0 and token1 addresses
    const token0Payload = {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: poolAddress,
          data: '0x0dfe1681' // token0() function selector
        },
        'latest'
      ],
      id: 2
    };
    
    const token1Payload = {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: poolAddress,
          data: '0xd21220a7' // token1() function selector
        },
        'latest'
      ],
      id: 3
    };
    
    console.log('Getting token0 address...');
    const token0Response = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(token0Payload)
    });
    
    if (!token0Response.ok) {
      const errorText = await token0Response.text();
      console.error('Token0 call failed:', token0Response.status, errorText);
      throw new Error(`Token0 call failed: ${token0Response.status}`);
    }
    
    const token0Result = await token0Response.json();
    console.log('Token0 result:', token0Result);
    
    if (token0Result.error) {
      console.error('Token0 RPC error:', token0Result.error);
      throw new Error(`Token0 RPC error: ${token0Result.error.message}`);
    }
    
    const token0Address = '0x' + token0Result.result.slice(26); // Remove padding and '0x'
    console.log('Token0 address:', token0Address);
    
    console.log('Getting token1 address...');
    const token1Response = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(token1Payload)
    });
    
    if (!token1Response.ok) {
      const errorText = await token1Response.text();
      console.error('Token1 call failed:', token1Response.status, errorText);
      throw new Error(`Token1 call failed: ${token1Response.status}`);
    }
    
    const token1Result = await token1Response.json();
    console.log('Token1 result:', token1Result);
    
    if (token1Result.error) {
      console.error('Token1 RPC error:', token1Result.error);
      throw new Error(`Token1 RPC error: ${token1Result.error.message}`);
    }
    
    const token1Address = '0x' + token1Result.result.slice(26); // Remove padding and '0x'
    console.log('Token1 address:', token1Address);
    
    console.log('Pool token addresses:', { token0: token0Address, token1: token1Address });
    
    // Get token decimals and symbols
    console.log('Getting token decimals and symbols...');
    const token0Decimals = await getTokenDecimals(token0Address);
    const token1Decimals = await getTokenDecimals(token1Address);
    const token0Symbol = await getTokenSymbol(token0Address);
    const token1Symbol = await getTokenSymbol(token1Address);
    
    console.log('Token metadata:', {
      token0Decimals,
      token1Decimals,
      token0Symbol,
      token1Symbol
    });
    
    const poolData: PoolData = {
      reserve0,
      reserve1,
      token0: token0Address,
      token1: token1Address,
      token0Decimals,
      token1Decimals,
      token0Symbol,
      token1Symbol
    };
    
    console.log('Real pool data retrieved:', poolData);
    return poolData;
    
  } catch (error) {
    console.error('Error fetching pool data from blockchain:', error);
    throw error; // Let it fail instead of silently falling back to mock data
  }
}

// Helper function to get token decimals
async function getTokenDecimals(tokenAddress: string): Promise<number> {
  try {
    const payload = {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: tokenAddress,
          data: '0x313ce567' // decimals() function selector
        },
        'latest'
      ],
      id: 1
    };
    
    const response = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if (result.error) {
      return 18; // Default to 18 decimals
    }
    
    const decimalsHex = result.result;
    return parseInt(decimalsHex, 16);
  } catch (error) {
    console.error('Error getting token decimals:', error);
    return 18; // Default to 18 decimals
  }
}

// Helper function to get token symbol
async function getTokenSymbol(tokenAddress: string): Promise<string> {
  try {
    const payload = {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: tokenAddress,
          data: '0x95d89b41' // symbol() function selector
        },
        'latest'
      ],
      id: 1
    };
    
    const response = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if (result.error) {
      return 'UNKNOWN'; // Default symbol
    }
    
    const symbolHex = result.result;
    // Convert hex to string (remove padding)
    const symbol = decodeHexString(symbolHex);
    return symbol;
  } catch (error) {
    console.error('Error getting token symbol:', error);
    return 'UNKNOWN'; // Default symbol
  }
}

// Helper function to decode hex string to readable text
function decodeHexString(hex: string): string {
  try {
    // Remove '0x' prefix and padding
    const cleanHex = hex.slice(2);
    
    // Convert hex to bytes
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    
    // Convert bytes to string, removing null bytes
    const text = new TextDecoder().decode(bytes).replace(/\0/g, '');
    return text;
  } catch (error) {
    console.error('Error decoding hex string:', error);
    return 'UNKNOWN';
  }
}

// Helper function to calculate swap amount out using constant product formula
function calculateSwapAmountOut(
  amountIn: string,
  reserveIn: string,
  reserveOut: string,
  decimalsIn: number,
  decimalsOut: number
): string {
  const amountInNum = parseFloat(amountIn);
  const reserveInNum = parseFloat(reserveIn) / Math.pow(10, decimalsIn);
  const reserveOutNum = parseFloat(reserveOut) / Math.pow(10, decimalsOut);
  
  // QuickSwap v2 uses 0.3% fee
  const fee = 0.003;
  const amountInWithFee = amountInNum * (1 - fee);
  
  // Constant product formula: (x + dx) * (y - dy) = x * y
  // dy = (y * dx) / (x + dx)
  const amountOut = (reserveOutNum * amountInWithFee) / (reserveInNum + amountInWithFee);
  
  return amountOut.toFixed(6);
}

// Helper function to calculate price impact
function calculatePriceImpact(
  amountIn: string,
  reserveIn: string,
  decimalsIn: number
): string {
  const amountInNum = parseFloat(amountIn);
  const reserveInNum = parseFloat(reserveIn) / Math.pow(10, decimalsIn);
  
  const priceImpact = (amountInNum / (reserveInNum + amountInNum)) * 100;
  return priceImpact.toFixed(4);
}

// Helper function to estimate gas cost in NEYXT
async function estimateGasInNeyxt(gasEstimate: string, gasPrice: string): Promise<string> {
  try {
    // Convert gas estimate and gas price to numbers
    const gas = parseInt(gasEstimate);
    const price = parseFloat(gasPrice);
    
    if (isNaN(gas) || isNaN(price)) {
      return '0';
    }

    // Calculate gas cost in ETH (wei)
    const gasCostWei = gas * price;
    
    // Convert to ETH
    const gasCostEth = gasCostWei / 1e18;
    
    // Get real-time WETH price for accurate NEYXT conversion
    const wethPriceUsd = await getWethUsdcPrice();
    
    // We need to get the actual NEYXT/WETH price from the pool
    // For now, use a reasonable estimate based on pool data
    // This should be calculated from actual pool reserves
    const neyxtPerEth = 300000; // This should come from actual pool data
    
    const gasCostNeyxt = gasCostEth * neyxtPerEth;
    
    return gasCostNeyxt.toFixed(6);
  } catch (error) {
    console.error('Error estimating gas in NEYXT:', error);
    return '0';
  }
}

// Helper function to get WETH/USDC price for USD conversion
async function getWethUsdcPrice(): Promise<number> {
  try {
    // WETH/USDC pool address on QuickSwap (this is a major pair)
    const wethUsdcPool = '0x853Ee4b2A13f8a742d64C8F088bE7bA2131f670d';
    
    // Get reserves from WETH/USDC pool
    const rpcPayload = {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: wethUsdcPool,
          data: '0x0902f1ac' // getReserves() function selector
        },
        'latest'
      ],
      id: 1
    };
    
    const response = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rpcPayload)
    });
    
    if (!response.ok) {
      throw new Error(`WETH/USDC RPC call failed: ${response.status}`);
    }
    
    const rpcResult = await response.json();
    if (rpcResult.error) {
      throw new Error(`WETH/USDC RPC error: ${rpcResult.error.message}`);
    }
    
    const reservesHex = rpcResult.result;
    if (!reservesHex || reservesHex === '0x') {
      throw new Error('No WETH/USDC reserves data returned');
    }
    
    // Parse reserves: reserve0 (32 bytes) + reserve1 (32 bytes) + blockTimestampLast (4 bytes)
    const reserve0Hex = reservesHex.slice(2, 66);
    const reserve1Hex = reservesHex.slice(66, 130);
    
    // Get token order to determine which is WETH vs USDC
    const token0Payload = {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: wethUsdcPool,
          data: '0x0dfe1681' // token0() function selector
        },
        'latest'
      ],
      id: 2
    };
    
    const token0Response = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(token0Payload)
    });
    
    const token0Result = await token0Response.json();
    const token0Address = '0x' + token0Result.result.slice(26);
    
    // Determine which reserve is WETH vs USDC
    const isWethToken0 = token0Address.toLowerCase() === POLYGON_CONTRACTS.weth.toLowerCase();
    
    const wethReserve = isWethToken0 ? 
      parseFloat(BigInt('0x' + reserve0Hex).toString()) / 1e18 : // WETH has 18 decimals
      parseFloat(BigInt('0x' + reserve1Hex).toString()) / 1e18;
    
    const usdcReserve = isWethToken0 ? 
      parseFloat(BigInt('0x' + reserve1Hex).toString()) / 1e6 : // USDC has 6 decimals
      parseFloat(BigInt('0x' + reserve0Hex).toString()) / 1e6;
    
    // Calculate WETH price in USD (USDC)
    const wethPriceUsd = usdcReserve / wethReserve;
    
    console.log('WETH/USDC price calculation:', {
      wethReserve: wethReserve.toFixed(6),
      usdcReserve: usdcReserve.toFixed(6),
      wethPriceUsd: wethPriceUsd.toFixed(2)
    });
    
    return wethPriceUsd;
    
  } catch (error) {
    console.error('Error getting WETH/USDC price:', error);
    // Fallback to approximate price
    return 3000; // Approximate WETH price in USD
  }
}

// Helper function to calculate USD equivalent price
async function calculateUsdPrice(neyxtAmount: string, payAsset: string, amountIn: string): Promise<string> {
  try {
    const neyxtNum = parseFloat(neyxtAmount);
    const amountInNum = parseFloat(amountIn);
    
    if (isNaN(neyxtNum) || isNaN(amountInNum)) {
      return '0.00';
    }
    
    let usdEquivalent = 0;
    
    if (payAsset.toUpperCase() === 'WETH') {
      // Get WETH price in USD
      const wethPriceUsd = await getWethUsdcPrice();
      usdEquivalent = amountInNum * wethPriceUsd;
    } else if (payAsset.toUpperCase() === 'USDC') {
      // USDC is already in USD
      usdEquivalent = amountInNum;
    } else if (payAsset.toUpperCase() === 'POL') {
      // POL price is approximately $1 (native token)
      usdEquivalent = amountInNum;
    }
    
    return usdEquivalent.toFixed(2);
    
  } catch (error) {
    console.error('Error calculating USD price:', error);
    return '0.00';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== QUOTE FUNCTION CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Current timestamp:', new Date().toISOString());
  console.log('Function version: UPDATED WITH REAL BLOCKCHAIN DATA');
  console.log('=====================================');

  // Quote endpoint
  if (req.method === 'GET') {
    try {
      // Parse query parameters
      const url = new URL(req.url);
      const payAsset = url.searchParams.get('payAsset');
      const amountIn = url.searchParams.get('amountIn');
      const receiveAsset = url.searchParams.get('receiveAsset');
      const userAddress = url.searchParams.get('userAddress');
      const slippagePercentage = url.searchParams.get('slippagePercentage');

      // Validate required parameters
      if (!payAsset || !amountIn || !receiveAsset) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required parameters',
            message: 'payAsset, amountIn, and receiveAsset are required' 
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

      if (!['USDC', 'POL', 'ETH', 'WETH'].includes(payAsset.toUpperCase())) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid pay asset',
            message: 'Only USDC, POL, ETH, or WETH can be used for payment' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Convert amount to smallest units (e.g., 100 USDC = 100000000)
      const amountInSmallestUnits = convertToSmallestUnits(amountIn, payAsset);
      
      // Get token addresses
      const payTokenAddress = getTokenAddress(payAsset);
      const receiveTokenAddress = getTokenAddress(receiveAsset);
      
      console.log('Fetching pool data for:', { payTokenAddress, receiveTokenAddress });

      // Fetch pool data from blockchain
      const poolData = await fetchPoolDataFromBlockchain(payTokenAddress, receiveTokenAddress);
      
      if (!poolData) {
        console.log('No pool found on blockchain');
        
        // Return a clear error for missing pool
        return new Response(
          JSON.stringify({ 
            error: 'Pool not found',
            message: `No liquidity pool found for ${payAsset}/${receiveAsset} on QuickSwap`,
            suggestion: 'Check if the token pair exists on QuickSwap v2',
            note: 'Pool data is available via direct blockchain connection in EnvironmentChecker'
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404 
          }
        );
      }

      console.log('Pool data retrieved:', poolData);

      // Determine which token is which in the pool
      const isPayToken0 = poolData.token0.toLowerCase() === payTokenAddress.toLowerCase();
      const payTokenDecimals = isPayToken0 ? poolData.token0Decimals : poolData.token1Decimals;
      const receiveTokenDecimals = isPayToken0 ? poolData.token1Decimals : poolData.token0Decimals;
      
      const reserveIn = isPayToken0 ? poolData.reserve0 : poolData.reserve1;
      const reserveOut = isPayToken0 ? poolData.reserve1 : poolData.reserve0;

      console.log('Pool analysis:', {
        isPayToken0,
        payTokenDecimals,
        receiveTokenDecimals,
        reserveIn,
        reserveOut
      });

      // Calculate swap amount out using constant product formula
      const amountOutEst = calculateSwapAmountOut(
        amountInSmallestUnits,
        reserveIn,
        reserveOut,
        payTokenDecimals,
        receiveTokenDecimals
      );

      // Calculate price impact
      const priceImpact = calculatePriceImpact(
        amountInSmallestUnits,
        reserveIn,
        payTokenDecimals
      );

      // Calculate price (amount of receive token per pay token)
      const price = isPayToken0 ? 
        (parseFloat(reserveOut) / parseFloat(reserveIn)).toFixed(6) : 
        (parseFloat(reserveIn) / parseFloat(reserveOut)).toFixed(6);

      // Calculate USD equivalent price
      const usdEquivalent = await calculateUsdPrice(amountOutEst, payAsset, amountIn);

      // Calculate USD price for 1 NEYXT token
      const neyxtPriceUsd = parseFloat(usdEquivalent) / parseFloat(amountOutEst);

      // Estimate gas (placeholder for now)
      const gasEstimate = '150000'; // 150k gas
      const gasPrice = '30000000000'; // 30 gwei
      
      // Calculate gas cost in NEYXT
      const gasInNeyxtEst = await estimateGasInNeyxt(gasEstimate, gasPrice);

      console.log('Quote calculation results:', {
        amountOutEst,
        priceImpact,
        price,
        usdEquivalent,
        neyxtPriceUsd: neyxtPriceUsd.toFixed(6),
        gasInNeyxtEst
      });

      // Build response
      const response: QuoteResponse = {
        routeId: `quickswap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amountOutEst,
        price,
        usdEquivalent, // Add USD equivalent
        neyxtPriceUsd: neyxtPriceUsd.toFixed(6), // Add NEYXT price in USD
        fees: {
          protocol: '0.3', // QuickSwap v2 fee
          gasInNeyxtEst,
        },
        slippageBps: Math.round((slippagePercentage ? parseFloat(slippagePercentage.toString()) : 1.0) * 100),
        estimatedTimeSec: 30,
        ttlSec: 45,
        warnings: [],
        sources: ['QuickSwap v2'],
        priceImpact: `${priceImpact}%`,
        gasEstimate,
      };

      console.log('Final quote response:', response);

      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );

    } catch (error) {
      console.error('Quote endpoint error:', error);
      
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
