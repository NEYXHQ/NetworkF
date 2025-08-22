// Auto-switching contract addresses based on environment (dev = testnet, prod = mainnet)
// TODO [M2.2] - Fill testnet contract addresses in environment variables
// TODO [M2.3] - Create WETH/NEYXT pool and record addresses
// TODO [M3.1] - Configure pricing policy bounds for sanity checks

export interface ContractAddresses {
  // Core tokens
  NEYXT: string;
  WETH: string;
  USDC: string;
  // POL is the native token - no contract address needed
  
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
  
  QUICKSWAP_FACTORY: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_QUICKSWAP_FACTORY
    : import.meta.env.VITE_POLYGON_MAINNET_QUICKSWAP_FACTORY,
  QUICKSWAP_ROUTER: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_QUICKSWAP_ROUTER
    : import.meta.env.VITE_POLYGON_MAINNET_QUICKSWAP_ROUTER,
  REF_POOL_ADDRESS: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_REF_POOL_ADDRESS
    : import.meta.env.VITE_POLYGON_MAINNET_REF_POOL_ADDRESS,
  
  // Biconomy uses singleton paymaster contracts per chain
  // Your instance is identified by API key + paymaster ID, not contract address
  BICONOMY_PAYMASTER: import.meta.env.DEV
    ? import.meta.env.VITE_POLYGON_TESTNET_BICONOMY_PAYMASTER
    : import.meta.env.VITE_POLYGON_MAINNET_BICONOMY_PAYMASTER,
  
  ALLOWED_ROUTERS: import.meta.env.DEV
    ? (import.meta.env.VITE_POLYGON_TESTNET_ALLOWED_ROUTERS?.split(',') || [])
    : (import.meta.env.VITE_POLYGON_MAINNET_ALLOWED_ROUTERS?.split(',') || [])
};

// Helper function to get native token address (POL)
export const getNativeTokenAddress = (): string => {
  // Native tokens use the special address 0x0000000000000000000000000000000000000000
  return '0x0000000000000000000000000000000000000000';
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

// Comprehensive environment variable validation
export const validateEnvironmentVariables = (): { isValid: boolean; missing: string[] } => {
  const isDev = import.meta.env.DEV;
  const missing: string[] = [];

  // Required for all environments
  if (!import.meta.env.VITE_WEB3AUTH_CLIENT_ID) missing.push('VITE_WEB3AUTH_CLIENT_ID');

  if (isDev) {
    // Development/Testnet required variables
    if (!import.meta.env.VITE_SUPABASE_DEV_URL) missing.push('VITE_SUPABASE_DEV_URL');
    if (!import.meta.env.VITE_SUPABASE_DEV_ANON_KEY) missing.push('VITE_SUPABASE_DEV_ANON_KEY');
    if (!import.meta.env.VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS) missing.push('VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS');
    if (!import.meta.env.VITE_POLYGON_TESTNET_WETH_CONTRACT_ADDRESS) missing.push('VITE_POLYGON_TESTNET_WETH_CONTRACT_ADDRESS');
    if (!import.meta.env.VITE_POLYGON_TESTNET_USDC_CONTRACT_ADDRESS) missing.push('VITE_POLYGON_TESTNET_USDC_CONTRACT_ADDRESS');
  } else {
    // Production/Mainnet required variables
    if (!import.meta.env.VITE_SUPABASE_PROD_URL) missing.push('VITE_SUPABASE_PROD_URL');
    if (!import.meta.env.VITE_SUPABASE_PROD_ANON_KEY) missing.push('VITE_SUPABASE_PROD_ANON_KEY');
    if (!import.meta.env.VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS) missing.push('VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS');
    if (!import.meta.env.VITE_POLYGON_MAINNET_WETH_CONTRACT_ADDRESS) missing.push('VITE_POLYGON_MAINNET_WETH_CONTRACT_ADDRESS');
    if (!import.meta.env.VITE_POLYGON_MAINNET_USDC_CONTRACT_ADDRESS) missing.push('VITE_POLYGON_MAINNET_USDC_CONTRACT_ADDRESS');
  }

  return {
    isValid: missing.length === 0,
    missing
  };
};

// Helper to get all contract addresses with proper fallbacks
export const getAllContractAddresses = () => {
  return {
    // Auto-switching addresses
    neyxt: CONTRACT_ADDRESSES.NEYXT,
    weth: CONTRACT_ADDRESSES.WETH,
    usdc: CONTRACT_ADDRESSES.USDC,
    quickswapFactory: CONTRACT_ADDRESSES.QUICKSWAP_FACTORY,
    quickswapRouter: CONTRACT_ADDRESSES.QUICKSWAP_ROUTER,
    refPoolAddress: CONTRACT_ADDRESSES.REF_POOL_ADDRESS,
    biconomyPaymaster: CONTRACT_ADDRESSES.BICONOMY_PAYMASTER,
    allowedRouters: CONTRACT_ADDRESSES.ALLOWED_ROUTERS,
    // Native token (POL)
    nativeToken: getNativeTokenAddress(),
    // Environment info
    environment: import.meta.env.DEV ? 'testnet' : 'mainnet',
    chainId: import.meta.env.DEV ? '80002' : '137',
  };
};

// Feature flags helper
export const getFeatureFlags = () => {
  return {
    enableFiat: import.meta.env.VITE_FEATURE_ENABLE_FIAT === 'true',
    enableGasSponsorship: import.meta.env.VITE_FEATURE_ENABLE_GAS_SPONSORSHIP === 'true',
    enableCrossChain: import.meta.env.VITE_FEATURE_ENABLE_CROSS_CHAIN === 'true',
  };
};
