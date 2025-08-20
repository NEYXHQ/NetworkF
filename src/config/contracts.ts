// TODO [M1.1] - Create contracts.ts (placeholders)
// TODO [M2.2] - Fill NEYXT/WETH/token router addresses
// TODO [M2.3] - Record QuickSwap v2 WETH/NEYXT 50/50 pool address (REF_POOL_ADDRESS) + QuickSwap router/factory
// TODO [M3.1] - Tag reference DEX = QuickSwap v2; policy bounds for sanity checks

export interface ContractAddresses {
  // Core tokens
  NEYXT: string;
  WETH: string;
  USDC: string;
  POL: string;
  
  // DEX contracts
  QUICKSWAP_FACTORY: string;
  QUICKSWAP_ROUTER: string;
  REF_POOL_ADDRESS: string; // WETH/NEYXT 50/50 pool
  
  // Paymaster
  BICONOMY_PAYMASTER: string;
  
  // Allowed routers for swaps
  ALLOWED_ROUTERS: string[];
}

export interface PricingPolicy {
  slippageBps: number;
  maxPriceImpactBps: number;
  quoteTtlSec: number;
  minPurchaseMultipleOfGas: number;
  maxTradeNotionalBase: string; // in WETH
  perWalletDailyCapBase: string; // in WETH
}

// TODO: Get from environment variables
export const CONTRACT_ADDRESSES: ContractAddresses = {
  NEYXT: '0x0000000000000000000000000000000000000000', // TODO: Set actual address
  WETH: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // Polygon WETH
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon USDC
  POL: '0x0000000000000000000000000000000000000000', // TODO: Set actual POL address
  
  QUICKSWAP_FACTORY: '0x5757371414417b8C6CAad45bAeF941aBc173d036', // QuickSwap v2 Factory
  QUICKSWAP_ROUTER: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap v2 Router
  REF_POOL_ADDRESS: '0x0000000000000000000000000000000000000000', // TODO: Set actual pool address
  
  BICONOMY_PAYMASTER: '0x0000000000000000000000000000000000000000', // TODO: Set actual paymaster address
  
  ALLOWED_ROUTERS: [
    '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap v2 Router
    // TODO: Add other allowed routers
  ]
};

export const PRICING_POLICY: PricingPolicy = {
  slippageBps: 100, // 1%
  maxPriceImpactBps: 200, // 2%
  quoteTtlSec: 45,
  minPurchaseMultipleOfGas: 1.25,
  maxTradeNotionalBase: '100', // 100 WETH
  perWalletDailyCapBase: '10' // 10 WETH per wallet per day
};

export const SUPPORTED_CHAINS = {
  POLYGON: {
    id: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com'
  },
  POLYGON_AMOY: {
    id: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorer: 'https://amoy.polygonscan.com'
  }
};

export const getContractAddresses = (_chainId: number): ContractAddresses => {
  // TODO: Return different addresses based on chain ID
  return CONTRACT_ADDRESSES;
};

export const getPricingPolicy = (_chainId: number): PricingPolicy => {
  // TODO: Return different policies based on chain ID
  return PRICING_POLICY;
};
