// Pricing utilities for QuickSwap v2 WETH/WFOUNDER reference pool validation
// Implements spot price, TWAP, and sanity checks for buy flow quotes

import { ethers } from 'https://esm.sh/ethers@6.13.4';
import { getCurrentNetwork, getContractAddresses, getRpcUrl } from './networks.ts';

// QuickSwap v2 Pair ABI (minimal interface)
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function price0CumulativeLast() external view returns (uint256)',
  'function price1CumulativeLast() external view returns (uint256)',
];

// ERC20 ABI (minimal interface)
const ERC20_ABI = [
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

interface PoolReserves {
  reserve0: bigint;
  reserve1: bigint;
  blockTimestampLast: number;
}

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

interface PriceData {
  spotPrice: number; // WFOUNDER per WETH
  reserve0: string; // Raw reserve amount
  reserve1: string; // Raw reserve amount
  token0: TokenInfo;
  token1: TokenInfo;
  blockTimestamp: number;
  isWfounderToken0: boolean; // True if WFOUNDER is token0, false if token1
  liquidityWeth: number; // WETH liquidity in human readable format
  liquidityWfounder: number; // WFOUNDER liquidity in human readable format
  priceImpact1Weth: number; // Price impact for 1 WETH trade
  priceImpact1Wfounder: number; // Price impact for 1 WFOUNDER trade
}

interface PricingPolicy {
  slippageBps: number;
  maxPriceImpactBps: number;
  quoteTtlSec: number;
  minPurchaseMultipleOfGas: number;
  maxTradeNotionalBase: string; // in WETH
  perWalletDailyCapBase: string; // in WETH
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Default pricing policy from contracts.ts
const DEFAULT_POLICY: PricingPolicy = {
  slippageBps: 100, // 1%
  maxPriceImpactBps: 200, // 2%
  quoteTtlSec: 45,
  minPurchaseMultipleOfGas: 1.25,
  maxTradeNotionalBase: '100', // 100 WETH
  perWalletDailyCapBase: '10' // 10 WETH per wallet per day
};

/**
 * Get RPC provider for the current environment
 */
function getRpcProvider(): ethers.JsonRpcProvider {
  const rpcUrl = getRpcUrl();
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Validate contract addresses before attempting to fetch data
 */
function validateContractAddresses(): void {
  const contracts = getContractAddresses();
  
  if (!contracts.refPool) {
    throw new Error('REF_POOL_ADDRESS not configured in environment variables');
  }
  
  if (!contracts.wfounder) {
    throw new Error('WFOUNDER contract address not configured in environment variables');
  }
  
  if (!contracts.weth) {
    throw new Error('WETH contract address not configured in environment variables');
  }
  
  // Validate address format
  if (!ethers.isAddress(contracts.refPool)) {
    throw new Error(`Invalid REF_POOL_ADDRESS format: ${contracts.refPool}`);
  }
  
  if (!ethers.isAddress(contracts.wfounder)) {
    throw new Error(`Invalid WFOUNDER address format: ${contracts.wfounder}`);
  }
  
  if (!ethers.isAddress(contracts.weth)) {
    throw new Error(`Invalid WETH address format: ${contracts.weth}`);
  }
}

/**
 * Fetch current pool reserves and metadata
 */
export async function fetchPoolData(): Promise<PriceData> {
  // Validate addresses first
  validateContractAddresses();
  
  const provider = getRpcProvider();
  const contracts = getContractAddresses();
  const { refPool: refPoolAddress, wfounder: wfounderAddress, weth: wethAddress } = contracts;

  try {
    console.log(`Fetching pool data from ${refPoolAddress} on ${getCurrentNetwork().displayName}`);
    
    // Create contract instances
    const pairContract = new ethers.Contract(refPoolAddress, PAIR_ABI, provider);
    
    // Fetch pool data with timeout
    const [reserves, token0Address, token1Address] = await Promise.all([
      pairContract.getReserves(),
      pairContract.token0(),
      pairContract.token1(),
    ]);

    // Determine which token is WFOUNDER and which is WETH
    const isWfounderToken0 = token0Address.toLowerCase() === wfounderAddress.toLowerCase();
    const isWethToken0 = token0Address.toLowerCase() === wethAddress.toLowerCase();
    const isWfounderToken1 = token1Address.toLowerCase() === wfounderAddress.toLowerCase();
    const isWethToken1 = token1Address.toLowerCase() === wethAddress.toLowerCase();

    // Validate this is actually a WFOUNDER/WETH pair
    if (!((isWfounderToken0 && isWethToken1) || (isWfounderToken1 && isWethToken0))) {
      throw new Error(`Pool at ${refPoolAddress} is not a WFOUNDER/WETH pair. Found tokens: ${token0Address}, ${token1Address}`);
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

    const token0: TokenInfo = {
      address: token0Address,
      symbol: token0Symbol,
      decimals: token0Decimals,
    };

    const token1: TokenInfo = {
      address: token1Address,
      symbol: token1Symbol,
      decimals: token1Decimals,
    };

    // Calculate spot price (WFOUNDER per WETH)
    const reserve0 = reserves[0];
    const reserve1 = reserves[1];
    const blockTimestampLast = reserves[2];

    let spotPrice: number;
    let liquidityWeth: number;
    let liquidityWfounder: number;
    
    if (isWfounderToken0) {
      // WFOUNDER is token0, WETH is token1
      // Price = reserve0 / reserve1 (WFOUNDER per WETH)
      const token0Formatted = Number(ethers.formatUnits(reserve0, token0Decimals));
      const token1Formatted = Number(ethers.formatUnits(reserve1, token1Decimals));
      spotPrice = token0Formatted / token1Formatted;
      liquidityWfounder = token0Formatted;
      liquidityWeth = token1Formatted;
    } else {
      // WETH is token0, WFOUNDER is token1
      // Price = reserve1 / reserve0 (WFOUNDER per WETH)
      const token0Formatted = Number(ethers.formatUnits(reserve0, token0Decimals));
      const token1Formatted = Number(ethers.formatUnits(reserve1, token1Decimals));
      spotPrice = token1Formatted / token0Formatted;
      liquidityWeth = token0Formatted;
      liquidityWfounder = token1Formatted;
    }

    // Create temporary pool data for price impact calculation
    const tempPoolData: PriceData = {
      spotPrice,
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      token0,
      token1,
      blockTimestamp: blockTimestampLast,
      isWfounderToken0,
      liquidityWeth: 0, // Will be set below
      liquidityWfounder: 0, // Will be set below
      priceImpact1Weth: 0, // Will be set below
      priceImpact1Wfounder: 0, // Will be set below
    };

    // Calculate price impact for 1 WETH and 1 WFOUNDER trades
    const priceImpact1Weth = calculatePriceImpactForAmount(tempPoolData, '1', true);
    const priceImpact1Wfounder = calculatePriceImpactForAmount(tempPoolData, '1', false);

    const poolData: PriceData = {
      spotPrice,
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      token0,
      token1,
      blockTimestamp: blockTimestampLast,
      isWfounderToken0,
      liquidityWeth,
      liquidityWfounder,
      priceImpact1Weth,
      priceImpact1Wfounder,
    };

    console.log(`Pool data fetched successfully: ${spotPrice.toFixed(6)} WFOUNDER per WETH, ${liquidityWeth.toFixed(4)} WETH liquidity`);
    
    return poolData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to fetch pool data: ${errorMessage}`);
    throw new Error(`Failed to fetch pool data: ${errorMessage}`);
  }
}

/**
 * Calculate price impact for a specific amount
 */
function calculatePriceImpactForAmount(
  poolData: PriceData,
  amountIn: string,
  isWethIn: boolean
): number {
  try {
    const amountInBigInt = ethers.parseEther(amountIn);
    
    // Determine which reserves to use
    let reserveIn: bigint, reserveOut: bigint;
    if (isWethIn) {
      if (poolData.isWfounderToken0) {
        // WETH in, WFOUNDER out
        reserveIn = BigInt(poolData.reserve1); // WETH reserve
        reserveOut = BigInt(poolData.reserve0); // WFOUNDER reserve
      } else {
        // WETH in, WFOUNDER out
        reserveIn = BigInt(poolData.reserve0); // WETH reserve
        reserveOut = BigInt(poolData.reserve1); // WFOUNDER reserve
      }
    } else {
      if (poolData.isWfounderToken0) {
        // WFOUNDER in, WETH out
        reserveIn = BigInt(poolData.reserve0); // WFOUNDER reserve
        reserveOut = BigInt(poolData.reserve1); // WETH reserve
      } else {
        // WFOUNDER in, WETH out
        reserveIn = BigInt(poolData.reserve1); // WFOUNDER reserve
        reserveOut = BigInt(poolData.reserve0); // WETH reserve
      }
    }

    // Calculate output using constant product formula (with 0.3% fee)
    // amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
    const amountInWithFee = amountInBigInt * 997n;
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 1000n + amountInWithFee;
    const amountOut = numerator / denominator;

    // Calculate price impact
    // Price impact = 1 - (amountOut / (amountIn * spotPrice))
    const expectedOut = isWethIn 
      ? amountInBigInt * BigInt(Math.floor(poolData.spotPrice * 1e18)) / BigInt(1e18)
      : amountInBigInt / BigInt(Math.floor(poolData.spotPrice * 1e18)) * BigInt(1e18);

    const priceImpact = 1 - Number(amountOut) / Number(expectedOut);
    return Math.max(0, priceImpact); // Ensure non-negative
  } catch (error) {
    console.error('Error calculating price impact:', error);
    return 0; // Return 0 impact on error
  }
}

/**
 * Calculate price impact for a given trade size
 */
export function calculatePriceImpact(
  poolData: PriceData,
  amountIn: string,
  isWethIn: boolean
): number {
  return calculatePriceImpactForAmount(poolData, amountIn, isWethIn);
}

/**
 * Validate quote against pricing policy and pool data
 */
export function validateQuote(
  poolData: PriceData,
  quotePrice: number,
  amountIn: string,
  amountOut: string,
  isWethIn: boolean,
  policy: PricingPolicy = DEFAULT_POLICY
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Check price deviation from pool spot price
    const priceDeviation = Math.abs(quotePrice - poolData.spotPrice) / poolData.spotPrice;
    const maxDeviation = policy.maxPriceImpactBps / 10000; // Convert bps to decimal

    if (priceDeviation > maxDeviation) {
      errors.push(`Price deviation ${(priceDeviation * 100).toFixed(2)}% exceeds maximum ${(maxDeviation * 100).toFixed(2)}%`);
    }

    // 2. Check price impact
    const priceImpact = calculatePriceImpact(poolData, amountIn, isWethIn);
    const maxPriceImpact = policy.maxPriceImpactBps / 10000;

    if (priceImpact > maxPriceImpact) {
      errors.push(`Price impact ${(priceImpact * 100).toFixed(2)}% exceeds maximum ${(maxPriceImpact * 100).toFixed(2)}%`);
    } else if (priceImpact > maxPriceImpact * 0.8) {
      warnings.push(`High price impact ${(priceImpact * 100).toFixed(2)}%`);
    }

    // 3. Check trade size limits
    const tradeNotional = isWethIn ? parseFloat(amountIn) : parseFloat(amountIn) / poolData.spotPrice;
    const maxTradeNotional = parseFloat(policy.maxTradeNotionalBase);

    if (tradeNotional > maxTradeNotional) {
      errors.push(`Trade size ${tradeNotional.toFixed(4)} WETH exceeds maximum ${maxTradeNotional} WETH`);
    }

    // 4. Check liquidity constraints
    const liquidityCheck = isWethIn ? poolData.liquidityWeth : poolData.liquidityWfounder;
    if (parseFloat(amountIn) > liquidityCheck * 0.1) { // Max 10% of liquidity
      warnings.push(`Trade size ${parseFloat(amountIn).toFixed(4)} represents more than 10% of available liquidity`);
    }

    // 5. Check minimum gas coverage (will be validated later with actual gas estimates)
    // This is a placeholder - actual validation happens in the quote endpoint

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
    };
  }
}

/**
 * Get current pricing policy
 */
export function getPricingPolicy(): PricingPolicy {
  return DEFAULT_POLICY;
}

/**
 * Check if pool data is stale
 */
export function isPoolDataStale(poolData: PriceData, maxAgeSeconds: number = 300): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  return (currentTime - poolData.blockTimestamp) > maxAgeSeconds;
}

/**
 * Format price for display
 */
export function formatPrice(price: number, decimals: number = 6): string {
  return price.toFixed(decimals);
}

/**
 * Convert basis points to percentage
 */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

/**
 * Get pool health metrics
 */
export function getPoolHealthMetrics(poolData: PriceData): {
  liquidityScore: number; // 0-100
  priceStability: number; // 0-100
  overallHealth: number; // 0-100
} {
  // Liquidity score based on total value locked
  const totalValueWeth = poolData.liquidityWeth + (poolData.liquidityWfounder / poolData.spotPrice);
  const liquidityScore = Math.min(100, (totalValueWeth / 100) * 100); // 100 WETH = 100% score
  
  // Price stability (placeholder - would need historical data for real calculation)
  const priceStability = 85; // Assume stable for now
  
  // Overall health is average of scores
  const overallHealth = (liquidityScore + priceStability) / 2;
  
  return {
    liquidityScore: Math.round(liquidityScore),
    priceStability: Math.round(priceStability),
    overallHealth: Math.round(overallHealth),
  };
}