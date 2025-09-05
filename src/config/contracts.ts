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
  NEYXT: import.meta.env.VITE_POLYGON_NEYXT_CONTRACT_ADDRESS as string,
  WETH: import.meta.env.VITE_POLYGON_WETH_CONTRACT_ADDRESS as string,
  USDC: import.meta.env.VITE_POLYGON_USDC_CONTRACT_ADDRESS as string,
  
  QUICKSWAP_FACTORY: import.meta.env.VITE_POLYGON_QUICKSWAP_FACTORY as string,
  QUICKSWAP_ROUTER: import.meta.env.VITE_POLYGON_QUICKSWAP_ROUTER as string,
  REF_POOL_ADDRESS: import.meta.env.VITE_POLYGON_REF_POOL_ADDRESS as string,
  
  // Biconomy uses singleton paymaster contracts per chain
  // Your instance is identified by API key + paymaster ID, not contract address
  BICONOMY_PAYMASTER: import.meta.env.VITE_POLYGON_BICONOMY_PAYMASTER as string
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
  const missing: string[] = [];

  // Required for all environments
  if (!import.meta.env.VITE_WEB3AUTH_CLIENT_ID) missing.push('VITE_WEB3AUTH_CLIENT_ID');

  // Supabase: generic
  if (!import.meta.env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!import.meta.env.VITE_SUPABASE_PROJECT_ID) missing.push('VITE_SUPABASE_PROJECT_ID');

  // Contracts: generic
  if (!import.meta.env.VITE_POLYGON_NEYXT_CONTRACT_ADDRESS) missing.push('VITE_POLYGON_NEYXT_CONTRACT_ADDRESS');
  if (!import.meta.env.VITE_POLYGON_WETH_CONTRACT_ADDRESS) missing.push('VITE_POLYGON_WETH_CONTRACT_ADDRESS');
  if (!import.meta.env.VITE_POLYGON_USDC_CONTRACT_ADDRESS) missing.push('VITE_POLYGON_USDC_CONTRACT_ADDRESS');
  if (!import.meta.env.VITE_POLYGON_QUICKSWAP_FACTORY) missing.push('VITE_POLYGON_QUICKSWAP_FACTORY');
  if (!import.meta.env.VITE_POLYGON_QUICKSWAP_ROUTER) missing.push('VITE_POLYGON_QUICKSWAP_ROUTER');
  if (!import.meta.env.VITE_POLYGON_REF_POOL_ADDRESS) missing.push('VITE_POLYGON_REF_POOL_ADDRESS');
  if (!import.meta.env.VITE_POLYGON_BICONOMY_PAYMASTER) missing.push('VITE_POLYGON_BICONOMY_PAYMASTER');

  // Airdrop configuration (only required if airdrops are enabled)
  const airdropEnabled = import.meta.env.VITE_FEATURE_ENABLE_AIRDROP !== 'false';
  if (airdropEnabled) {
    if (!import.meta.env.VITE_POLYGON_TREASURY_WALLET_ADDRESS) missing.push('VITE_POLYGON_TREASURY_WALLET_ADDRESS');
    if (!import.meta.env.VITE_POLYGON_TREASURY_WALLET_PRIVATE_KEY) missing.push('VITE_POLYGON_TREASURY_WALLET_PRIVATE_KEY');
    // VITE_NEYXT_AIRDROP_AMOUNT_FOR_SURVEY_COMPLETION is optional, defaults to '10'
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
    // Native token (POL)
    nativeToken: getNativeTokenAddress(),
    // Environment info
    environment: import.meta.env.DEV ? 'testnet' : 'mainnet',
    chainId: import.meta.env.DEV ? '80002' : '137',
  };
};

// Airdrop configuration helper
export const getAirdropConfig = () => {
  return {
    airdropAmount: import.meta.env.VITE_NEYXT_AIRDROP_AMOUNT_FOR_SURVEY_COMPLETION || '10',
    treasuryWalletAddress: import.meta.env.VITE_POLYGON_TREASURY_WALLET_ADDRESS as string,
    treasuryWalletPrivateKey: import.meta.env.VITE_POLYGON_TREASURY_WALLET_PRIVATE_KEY as string,
    enableAirdrop: import.meta.env.VITE_FEATURE_ENABLE_AIRDROP !== 'false', // Default enabled
  };
};

// Feature flags helper
export const getFeatureFlags = () => {
  return {
    enableFiat: import.meta.env.VITE_FEATURE_ENABLE_FIAT === 'true',
    enableGasSponsorship: import.meta.env.VITE_FEATURE_ENABLE_GAS_SPONSORSHIP === 'true',
    enableCrossChain: import.meta.env.VITE_FEATURE_ENABLE_CROSS_CHAIN === 'true',
    enableAirdrop: getAirdropConfig().enableAirdrop,
  };
};
