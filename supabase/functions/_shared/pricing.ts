// Pricing utilities for QuickSwap v2 WETH/NEYXT reference pool validation
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
  spotPrice: number; // NEYXT per WETH
  reserve0: string; // Raw reserve amount
  reserve1: string; // Raw reserve amount
  token0: TokenInfo;
  token1: TokenInfo;
  blockTimestamp: number;
  isNeyxtToken0: boolean; // True if NEYXT is token0, false if token1
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
 * Fetch current pool reserves and metadata
 */
export async function fetchPoolData(): Promise<PriceData> {
  const provider = getRpcProvider();
  const contracts = getContractAddresses();
  const { refPool: refPoolAddress, neyxt: neyxtAddress, weth: wethAddress } = contracts;

  if (!refPoolAddress || !neyxtAddress || !wethAddress) {
    throw new Error('Missing required contract addresses in environment variables');
  }

  try {
    // Create contract instances
    const pairContract = new ethers.Contract(refPoolAddress, PAIR_ABI, provider);
    
    // Fetch pool data
    const [reserves, token0Address, token1Address] = await Promise.all([
      pairContract.getReserves(),
      pairContract.token0(),
      pairContract.token1(),
    ]);

    // Determine which token is NEYXT and which is WETH
    const isNeyxtToken0 = token0Address.toLowerCase() === neyxtAddress.toLowerCase();
    const isWethToken0 = token0Address.toLowerCase() === wethAddress.toLowerCase();
    const isNeyxtToken1 = token1Address.toLowerCase() === neyxtAddress.toLowerCase();
    const isWethToken1 = token1Address.toLowerCase() === wethAddress.toLowerCase();

    // Validate this is actually a NEYXT/WETH pair
    if (!((isNeyxtToken0 && isWethToken1) || (isNeyxtToken1 && isWethToken0))) {
      throw new Error(`Pool at ${refPoolAddress} is not a NEYXT/WETH pair`);
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

    // Calculate spot price (NEYXT per WETH)
    const reserve0 = reserves[0];
    const reserve1 = reserves[1];
    const blockTimestampLast = reserves[2];

    let spotPrice: number;
    if (isNeyxtToken0) {
      // NEYXT is token0, WETH is token1
      // Price = reserve1 / reserve0 (WETH per NEYXT)
      // We want NEYXT per WETH, so invert: reserve0 / reserve1
      const token0Formatted = Number(ethers.formatUnits(reserve0, token0Decimals));
      const token1Formatted = Number(ethers.formatUnits(reserve1, token1Decimals));
      spotPrice = token0Formatted / token1Formatted;
    } else {
      // WETH is token0, NEYXT is token1
      // Price = reserve0 / reserve1 (WETH per NEYXT)
      // We want NEYXT per WETH, so: reserve1 / reserve0
      const token0Formatted = Number(ethers.formatUnits(reserve0, token0Decimals));
      const token1Formatted = Number(ethers.formatUnits(reserve1, token1Decimals));
      spotPrice = token1Formatted / token0Formatted;
    }

    return {
      spotPrice,
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      token0,
      token1,
      blockTimestamp: blockTimestampLast,
      isNeyxtToken0,
    };
  } catch (error) {
    throw new Error(`Failed to fetch pool data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  const amountInBigInt = ethers.parseEther(amountIn);
  
  // Determine which reserves to use
  let reserveIn: bigint, reserveOut: bigint;
  if (isWethIn) {
    if (poolData.isNeyxtToken0) {
      // WETH in, NEYXT out
      reserveIn = BigInt(poolData.reserve1); // WETH reserve
      reserveOut = BigInt(poolData.reserve0); // NEYXT reserve
    } else {
      // WETH in, NEYXT out
      reserveIn = BigInt(poolData.reserve0); // WETH reserve
      reserveOut = BigInt(poolData.reserve1); // NEYXT reserve
    }
  } else {
    if (poolData.isNeyxtToken0) {
      // NEYXT in, WETH out
      reserveIn = BigInt(poolData.reserve0); // NEYXT reserve
      reserveOut = BigInt(poolData.reserve1); // WETH reserve
    } else {
      // NEYXT in, WETH out
      reserveIn = BigInt(poolData.reserve1); // NEYXT reserve
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

    // 4. Check minimum gas coverage (will be validated later with actual gas estimates)
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