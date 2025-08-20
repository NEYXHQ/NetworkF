// TODO [M3.2] - QuickSwap v2 reserve math + TWAP; apply sanity bounds vs REF_POOL_ADDRESS
// TODO [M3.1] - Reference pool price validation
// TODO [M4.4] - Slippage and price impact calculations

export interface PoolReserves {
  reserve0: string;
  reserve1: string;
  token0: string;
  token1: string;
}

export interface PriceData {
  spot: string;
  twap: string;
  timestamp: number;
  poolAddress: string;
}

export interface PricingValidation {
  valid: boolean;
  slippageOk: boolean;
  priceImpactOk: boolean;
  warnings: string[];
  errors: string[];
}

export interface PricingPolicy {
  slippageBps: number;
  maxPriceImpactBps: number;
  quoteTtlSec: number;
  minPurchaseMultipleOfGas: number;
  maxTradeNotionalBase: string;
  perWalletDailyCapBase: string;
}

export class PricingService {
  private refPoolAddress: string;
  private policy: PricingPolicy;

  constructor(refPoolAddress: string, policy: PricingPolicy) {
    this.refPoolAddress = refPoolAddress;
    this.policy = policy;
  }

  async getPoolReserves(poolAddress: string): Promise<PoolReserves> {
    // TODO: Implement actual pool reserve fetching
    console.log('Getting pool reserves for:', poolAddress);
    
    // Placeholder response
    return {
      reserve0: '1000000000000000000000', // 1000 WETH
      reserve1: '1000000000000000000000', // 1000 NEYXT
      token0: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WETH
      token1: '0x0000000000000000000000000000000000000000' // NEYXT (placeholder)
    };
  }

  async getPriceData(poolAddress: string): Promise<PriceData> {
    // TODO: Implement actual price fetching (spot + TWAP)
    console.log('Getting price data for pool:', poolAddress);
    
    // Placeholder response
    return {
      spot: '1.0', // 1 WETH = 1 NEYXT
      twap: '1.0', // Time-weighted average price
      timestamp: Date.now(),
      poolAddress
    };
  }

  validateQuote(
    quotePrice: string,
    refPrice: string,
    amountIn: string,
    amountOut: string,
    gasInNeyxt: string
  ): PricingValidation {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Calculate price impact
    const priceImpact = Math.abs(parseFloat(quotePrice) - parseFloat(refPrice)) / parseFloat(refPrice);
    const priceImpactBps = priceImpact * 10000;
    
    // Check price impact
    if (priceImpactBps > this.policy.maxPriceImpactBps) {
      errors.push(`Price impact too high: ${priceImpactBps.toFixed(2)} bps (max: ${this.policy.maxPriceImpactBps} bps)`);
    }
    
    // Check slippage
    if (parseFloat(amountOut) < parseFloat(amountIn) * (1 - this.policy.slippageBps / 10000)) {
      errors.push(`Slippage exceeds limit: ${this.policy.slippageBps / 100}%`);
    }
    
    // Check gas coverage
    const neyxtOut = parseFloat(amountOut);
    const gasRequired = parseFloat(gasInNeyxt) * this.policy.minPurchaseMultipleOfGas;
    
    if (neyxtOut < gasRequired) {
      errors.push(`Insufficient NEYXT output to cover gas fees. Need at least ${gasRequired.toFixed(4)} NEYXT`);
    }
    
    // Check trade size
    const tradeNotional = parseFloat(amountIn);
    const maxTrade = parseFloat(this.policy.maxTradeNotionalBase);
    
    if (tradeNotional > maxTrade) {
      errors.push(`Trade size exceeds limit: ${tradeNotional} (max: ${maxTrade})`);
    }
    
    const valid = errors.length === 0;
    
    return {
      valid,
      slippageOk: !errors.some(e => e.includes('Slippage')),
      priceImpactOk: !errors.some(e => e.includes('Price impact')),
      warnings,
      errors
    };
  }

  calculateSlippage(amountIn: string, amountOut: string, expectedAmountOut: string): number {
    const actual = parseFloat(amountOut);
    const expected = parseFloat(expectedAmountOut);
    
    if (expected === 0) return 0;
    
    return ((expected - actual) / expected) * 100;
  }

  calculatePriceImpact(quotePrice: string, refPrice: string): number {
    const quote = parseFloat(quotePrice);
    const ref = parseFloat(refPrice);
    
    if (ref === 0) return 0;
    
    return ((quote - ref) / ref) * 100;
  }
}

export const createPricingService = (refPoolAddress: string, policy: PricingPolicy): PricingService => {
  return new PricingService(refPoolAddress, policy);
};
