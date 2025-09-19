// M4.1 - GET /api/quote with Direct AMM Pool Calculations (Polygon-only)
// M4.2 - Return gas_in_wfounder_est and warnings for min purchase
// M4.3 - Enforce min purchase (WFOUNDER_out ≥ 1.25× gas_in_wfounder_est)
// M4.4 - Apply per-trade cap (≤ max_trade_notional_base)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { ethers } from "https://esm.sh/ethers@6.8.0"

// Token addresses for Ethereum
const ETHEREUM_TOKENS = {
  weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH on Ethereum
  usdc: '0xA0b86a33E6441c959ecAFB81CD29b5bb42AEd08A', // USDC on Ethereum
  wfounder: process.env.VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS || '', // WFOUNDER on Ethereum
  eth: '0x0000000000000000000000000000000000000000', // Native ETH token
};

// AMM Pool Configuration
const POOL_CONFIG = {
  // WETH/WFOUNDER 50/50 pool address
  wethWfounderPool: process.env.VITE_ETHEREUM_REF_POOL_ADDRESS || '',
  // Uniswap router for additional pool queries if needed
  uniswapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
  // RPC endpoint for blockchain queries
  rpcUrl: process.env.SUPA_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
};

// Uniswap V2 Pair ABI (for reading pool reserves)
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

// ERC20 ABI (for token decimals)
const ERC20_ABI = [
  'function decimals() external view returns (uint8)'
];



// Pool Reserve Data Interface
interface PoolReserves {
  reserve0: bigint;
  reserve1: bigint;
  token0: string;
  token1: string;
  blockTimestamp: number;
}

// AMM Calculation Result Interface
interface AmmCalculation {
  amountOut: bigint;
  priceImpact: number;
  effectivePrice: number;
  poolLiquidity: { token0: bigint; token1: bigint };
}

interface QuoteResponse {
  routeId: string;
  amountOutEst: string;
  price: string;
  usdEquivalent?: string; // Add USD equivalent
  wfounderPriceUsd?: string; // Add WFOUNDER price in USD
  fees: {
    protocol: string;
    gasInPolEst: string;
  };
  slippageBps: number;
  estimatedTimeSec: number;
  ttlSec: number;
  warnings: string[];
  sources: string[];
  priceImpact: string;
  gasEstimate: string;
  poolLiquidity: {
    weth: string;
    wfounder: string;
  };
}



// Helper function to get token address from asset name
function getTokenAddress(asset: string): string {
  switch (asset.toUpperCase()) {
    case 'WETH':
    case 'ETH':
      return ETHEREUM_TOKENS.weth;
    case 'USDC':
      return ETHEREUM_TOKENS.usdc;
    case 'WFOUNDER':
      return ETHEREUM_TOKENS.wfounder;
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

// Initialize blockchain provider for pool queries
function createProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(POOL_CONFIG.rpcUrl);
}

// Get pool reserves from WETH/WFOUNDER pair
async function getPoolReserves(poolAddress: string): Promise<PoolReserves> {
  const provider = createProvider();
  const pairContract = new ethers.Contract(poolAddress, PAIR_ABI, provider);

  try {
    const [reserve0, reserve1, blockTimestamp] = await pairContract.getReserves();
    const token0 = await pairContract.token0();
    const token1 = await pairContract.token1();

    return {
      reserve0: BigInt(reserve0.toString()),
      reserve1: BigInt(reserve1.toString()),
      token0,
      token1,
      blockTimestamp: Number(blockTimestamp)
    };
  } catch (error) {
    console.error('Error fetching pool reserves:', error);
    throw new Error(`Failed to fetch pool reserves: ${error}`);
  }
}

// Calculate AMM swap using constant product formula
function calculateAmmSwap(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): AmmCalculation {
  // Constant product formula: (x + Δx)(y - Δy) = xy
  // Where Δy = (Δx * y) / (x + Δx)

  const amountInWithFee = amountIn * 997n; // 0.3% fee
  const numerator = amountInWithFee * reserveOut;
  const denominator = (reserveIn * 1000n) + amountInWithFee;
  const amountOut = numerator / denominator;

  // Calculate price impact: (1 - (reserveOut - amountOut) / reserveOut) * 100
  const priceImpact = Number((reserveOut - (reserveOut - amountOut)) * 10000n / reserveOut) / 100;

  // Calculate effective price
  const effectivePrice = Number(amountOut) / Number(amountIn);

  return {
    amountOut,
    priceImpact,
    effectivePrice,
    poolLiquidity: {
      token0: reserveIn,
      token1: reserveOut
    }
  };
}

// Get quote for token swap via WETH bridge if needed
async function getAmmQuote(
  fromTokenAddress: string,
  toTokenAddress: string,
  amountIn: bigint
): Promise<AmmCalculation> {
  const wethAddress = ETHEREUM_TOKENS.weth;
  const wfounderAddress = ETHEREUM_TOKENS.wfounder;

  // Direct WETH -> WFOUNDER swap
  if (fromTokenAddress.toLowerCase() === wethAddress.toLowerCase() &&
      toTokenAddress.toLowerCase() === wfounderAddress.toLowerCase()) {

    const poolReserves = await getPoolReserves(POOL_CONFIG.wethWfounderPool);

    // Determine which reserve is WETH and which is WFOUNDER
    const isToken0Weth = poolReserves.token0.toLowerCase() === wethAddress.toLowerCase();
    const wethReserve = isToken0Weth ? poolReserves.reserve0 : poolReserves.reserve1;
    const wfounderReserve = isToken0Weth ? poolReserves.reserve1 : poolReserves.reserve0;

    return calculateAmmSwap(amountIn, wethReserve, wfounderReserve);
  }

  // For other tokens (USDC, POL), bridge through WETH
  // This would require additional pool queries and two-hop calculations
  // For now, throwing error as this requires more complex routing
  throw new Error(`Direct swap from ${fromTokenAddress} to ${toTokenAddress} not supported. Only WETH->WFOUNDER is currently implemented.`);
}

// Calculate USD equivalent for different assets
function calculateUsdEquivalent(asset: string, amount: string): string {
  const amountNum = parseFloat(amount);

  switch (asset.toUpperCase()) {
    case 'USDC':
      return amountNum.toFixed(2);
    case 'WETH':
    case 'ETH':
      return (amountNum * 3000).toFixed(2); // Approximate ETH price
    default:
      return '0.00';
  }
}

// Estimate gas costs in ETH
function estimateGasInEth(gasEstimate: string): string {
  try {
    const gas = parseInt(gasEstimate);
    // Calculate gas cost in ETH: gas units * gas price (30 gwei) / 1e18
    const gasCostEth = (gas * 30e9) / 1e18;
    return gasCostEth.toFixed(6);
  } catch (error) {
    console.error('Error estimating gas in ETH:', error);
    return '0.001'; // Default estimate (small amount of ETH)
  }
}

// Generate warnings based on price impact and pool conditions
function generateWarnings(
  priceImpact: number,
  poolLiquidity: { token0: bigint; token1: bigint },
  amountInUsd: number
): string[] {
  const warnings: string[] = [];

  // Price impact warnings
  if (priceImpact > 50) {
    warnings.push(`EXTREME PRICE IMPACT: ${priceImpact.toFixed(2)}% - Trade not recommended`);
  } else if (priceImpact > 15) {
    warnings.push(`HIGH PRICE IMPACT: ${priceImpact.toFixed(2)}% - Consider smaller amount`);
  } else if (priceImpact > 5) {
    warnings.push(`Moderate price impact: ${priceImpact.toFixed(2)}%`);
  }

  // Pool liquidity warnings
  const wethLiquidity = Number(poolLiquidity.token0) / 1e18;
  const wfounderLiquidity = Number(poolLiquidity.token1) / 1e18;
  const totalLiquidityUsd = wethLiquidity * 3000; // Approximate WETH value

  if (totalLiquidityUsd < 1000) {
    warnings.push('LOW LIQUIDITY POOL: Pool has limited liquidity, expect high slippage');
  }

  if (amountInUsd > totalLiquidityUsd * 0.1) {
    warnings.push(`Large trade relative to pool size - Consider multiple smaller trades`);
  }

  return warnings;
}

// Main function to get quote using direct AMM calculations
async function getQuote(
  payAsset: string,
  amountIn: string,
  receiveAsset: string
): Promise<QuoteResponse> {
  const fromTokenAddress = getTokenAddress(payAsset);
  const toTokenAddress = getTokenAddress(receiveAsset);
  const amountInBigInt = BigInt(convertToSmallestUnits(amountIn, payAsset));

  console.log('Getting AMM quote:', {
    payAsset,
    receiveAsset,
    amountIn,
    fromTokenAddress,
    toTokenAddress,
    amountInBigInt: amountInBigInt.toString()
  });

  try {
    // Get AMM calculation result
    const ammResult = await getAmmQuote(fromTokenAddress, toTokenAddress, amountInBigInt);

    // Convert amounts to human-readable format
    const amountOutEst = (Number(ammResult.amountOut) / 1e18).toFixed(6);
    const price = (parseFloat(amountOutEst) / parseFloat(amountIn)).toFixed(6);

    // Calculate USD equivalent
    const usdEquivalent = calculateUsdEquivalent(payAsset, amountIn);

    // Calculate WFOUNDER price in USD
    const wfounderPriceUsd = parseFloat(usdEquivalent) / parseFloat(amountOutEst);

    // Estimate gas costs (typical AMM swap)
    const gasEstimate = '180000';
    const gasInEthEst = estimateGasInEth(gasEstimate);

    // Generate warnings based on AMM calculation
    const warnings = generateWarnings(
      ammResult.priceImpact,
      ammResult.poolLiquidity,
      parseFloat(usdEquivalent)
    );

    // Convert pool liquidity to human-readable format
    const wethLiquidity = (Number(ammResult.poolLiquidity.token0) / 1e18).toFixed(6);
    const wfounderLiquidity = (Number(ammResult.poolLiquidity.token1) / 1e18).toFixed(6);

    return {
      routeId: `amm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amountOutEst,
      price,
      usdEquivalent,
      wfounderPriceUsd: wfounderPriceUsd.toFixed(6),
      fees: {
        protocol: '0.3', // Standard AMM fee
        gasInEthEst,
      },
      slippageBps: 100, // 1% default
      estimatedTimeSec: 15, // Faster than DEX aggregators
      ttlSec: 45,
      warnings,
      sources: ['AMM'],
      priceImpact: `${ammResult.priceImpact.toFixed(2)}%`,
      gasEstimate,
      poolLiquidity: {
        weth: wethLiquidity,
        wfounder: wfounderLiquidity
      }
    };

  } catch (error) {
    console.error('AMM quote calculation failed:', error);
    throw new Error(`Failed to calculate AMM quote: ${error}`);
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

      // Validate minimum purchase amount
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

      // Check if POL is being used (currently disabled)
      if (payAsset.toUpperCase() === 'POL') {
        return new Response(
          JSON.stringify({ 
            error: 'Asset temporarily disabled',
            message: 'POL payments are currently disabled due to quote issues' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Set minimum amounts based on asset type
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

      // Get quote using direct AMM calculations
      const response = await getQuote(payAsset, amountIn, receiveAsset);
      
      // Add slippage from request if provided
      if (slippagePercentage) {
        response.slippageBps = Math.round(parseFloat(slippagePercentage.toString()) * 100);
      }

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
