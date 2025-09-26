// Auto-switching contract addresses based on environment (dev = testnet, prod = mainnet)
// TODO [M2.2] - Fill testnet contract addresses in environment variables
// TODO [M2.3] - Create WETH/WFOUNDER pool and record addresses
// TODO [M3.1] - Configure pricing policy bounds for sanity checks

export interface ContractAddresses {
  // Core tokens
  WFOUNDER: string;
  USDC: string;

  // DEX contracts
  UNISWAP_ROUTER: string;
  REF_POOL_ADDRESS: string; // USDC/WFOUNDER pool
}

export interface PricingPolicy {
  slippageBps: number;
  maxPriceImpactBps: number;
  quoteTtlSec: number;
  minPurchaseMultipleOfGas: number;
  maxTradeNotionalBase: string; // in USDC
  perWalletDailyCapBase: string; // in USDC
}

// Auto-select contract addresses based on environment (dev = testnet, prod = mainnet)
export const CONTRACT_ADDRESSES: ContractAddresses = {
  WFOUNDER: import.meta.env.VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS as string,
  USDC: import.meta.env.VITE_ETHEREUM_USDC_CONTRACT_ADDRESS as string,

  UNISWAP_ROUTER: import.meta.env.VITE_ETHEREUM_UNISWAP_ALLOWED_ROUTERS as string,
  REF_POOL_ADDRESS: import.meta.env.VITE_ETHEREUM_REF_POOL_ADDRESS as string
};

// Helper function to get native token address (ETH)
export const getNativeTokenAddress = (): string => {
  // Native tokens use the special address 0x0000000000000000000000000000000000000000
  return '0x0000000000000000000000000000000000000000';
};

export const PRICING_POLICY: PricingPolicy = {
  slippageBps: 100, // 1%
  maxPriceImpactBps: 200, // 2%
  quoteTtlSec: 45,
  minPurchaseMultipleOfGas: 1.25,
  maxTradeNotionalBase: '10000', // 10,000 USDC
  perWalletDailyCapBase: '1000' // 1,000 USDC per wallet per day
};

export const SUPPORTED_CHAINS = {
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorer: 'https://etherscan.io'
  },
  ETHEREUM_SEPOLIA: {
    id: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorer: 'https://sepolia.etherscan.io'
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

  // Contracts: only check what we actually use
  if (!import.meta.env.VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS) missing.push('VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS');
  if (!import.meta.env.VITE_ETHEREUM_USDC_CONTRACT_ADDRESS) missing.push('VITE_ETHEREUM_USDC_CONTRACT_ADDRESS');
  if (!import.meta.env.VITE_ETHEREUM_UNISWAP_ALLOWED_ROUTERS) missing.push('VITE_ETHEREUM_UNISWAP_ALLOWED_ROUTERS');
  if (!import.meta.env.VITE_ETHEREUM_REF_POOL_ADDRESS) missing.push('VITE_ETHEREUM_REF_POOL_ADDRESS');

  // Airdrop configuration (only required if airdrops are enabled)
  const airdropEnabled = import.meta.env.VITE_FEATURE_ENABLE_AIRDROP !== 'false';
  if (airdropEnabled) {
    if (!import.meta.env.VITE_ETHEREUM_TREASURY_WALLET_ADDRESS) missing.push('VITE_ETHEREUM_TREASURY_WALLET_ADDRESS');
    if (!import.meta.env.VITE_ETHEREUM_TREASURY_WALLET_PRIVATE_KEY) missing.push('VITE_ETHEREUM_TREASURY_WALLET_PRIVATE_KEY');
    // VITE_WFOUNDER_AIRDROP_AMOUNT_FOR_SURVEY_COMPLETION is optional, defaults to '10'
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
    wfounder: CONTRACT_ADDRESSES.WFOUNDER,
    usdc: CONTRACT_ADDRESSES.USDC,
    uniswapRouter: CONTRACT_ADDRESSES.UNISWAP_ROUTER,
    refPoolAddress: CONTRACT_ADDRESSES.REF_POOL_ADDRESS,
    // Environment info
    environment: import.meta.env.DEV ? 'testnet' : 'mainnet',
    chainId: import.meta.env.DEV ? '11155111' : '1',
  };
};

// Airdrop configuration helper
export const getAirdropConfig = () => {
  return {
    airdropAmount: import.meta.env.VITE_WFOUNDER_AIRDROP_AMOUNT_FOR_SURVEY_COMPLETION || '10',
    treasuryWalletAddress: import.meta.env.VITE_ETHEREUM_TREASURY_WALLET_ADDRESS as string,
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
