// Auto-switching contract addresses based on environment (dev = testnet, prod = mainnet)
// TODO [M2.2] - Fill testnet contract addresses in environment variables
// TODO [M2.3] - Create WETH/NEYXT pool and record addresses
// TODO [M3.1] - Configure pricing policy bounds for sanity checks

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

// Auto-select contract addresses based on environment (dev = testnet, prod = mainnet)
export const CONTRACT_ADDRESSES: ContractAddresses = {
  NEYXT: import.meta.env.DEV 
    ? import.meta.env.VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS
    : import.meta.env.VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS,
  WETH: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_WETH_CONTRACT_ADDRESS
    : import.meta.env.VITE_POLYGON_MAINNET_WETH_CONTRACT_ADDRESS,
  USDC: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_USDC_CONTRACT_ADDRESS
    : import.meta.env.VITE_POLYGON_MAINNET_USDC_CONTRACT_ADDRESS,
  POL: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_POL_CONTRACT_ADDRESS
    : import.meta.env.VITE_POLYGON_MAINNET_POL_CONTRACT_ADDRESS,
  
  QUICKSWAP_FACTORY: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_QUICKSWAP_FACTORY
    : import.meta.env.VITE_POLYGON_MAINNET_QUICKSWAP_FACTORY,
  QUICKSWAP_ROUTER: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_QUICKSWAP_ROUTER
    : import.meta.env.VITE_POLYGON_MAINNET_QUICKSWAP_ROUTER,
  REF_POOL_ADDRESS: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_REF_POOL_ADDRESS
    : import.meta.env.VITE_POLYGON_MAINNET_REF_POOL_ADDRESS,
  
  BICONOMY_PAYMASTER: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_BICONOMY_PAYMASTER
    : import.meta.env.VITE_POLYGON_MAINNET_BICONOMY_PAYMASTER,
  
  ALLOWED_ROUTERS: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_ALLOWED_ROUTERS?.split(',')
    : import.meta.env.VITE_POLYGON_MAINNET_ALLOWED_ROUTERS?.split(',')
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

export const getContractAddresses = (): ContractAddresses => {
  // Auto-selects testnet/mainnet addresses based on environment
  return CONTRACT_ADDRESSES;
};

export const getPricingPolicy = (): PricingPolicy => {
  // Auto-selects testnet/mainnet policies based on environment
  return PRICING_POLICY;
};
