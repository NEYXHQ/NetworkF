import { currentNetwork, type NetworkConfig } from './networks';

// Resolve Supabase URL once from generic key
const resolvedSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';

interface Config {
  web3AuthClientId: string;
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
  network: NetworkConfig; // Comprehensive network data
  chainId: string; // Legacy compatibility for existing code
  neyxtContractAddress: string;
  web3AuthNetwork: 'sapphire_devnet' | 'sapphire_mainnet';
  // Supabase configuration
  supabase: {
    url: string;
    anonKey: string;
    projectId: string;
  };
  // AI service configuration
  ai: {
    supabaseEdgeUrl: string;
    fallbackApiUrl: string;
    useSupabase: boolean;
  };
  // Buy Flow configuration
  buyFlow: {
    // Feature flags
    enableFiat: boolean;
    enableGasSponsorship: boolean;
    enableCrossChain: boolean;
    // API configuration
    apiBaseUrl: string;
    chainId: string;
    neyxtAddress: string;
    // All contract addresses (auto-switching based on environment)
    contracts: {
      weth: string;
      usdc: string;
      quickswapFactory: string;
      quickswapRouter: string;
      refPoolAddress: string;
      biconomyPaymaster: string;
    };
    // Provider API keys (stored in Supabase secrets)
    zeroXApiKey?: string; // Available in Edge Functions only
    // Note: Biconomy uses singleton contracts - identified by API key + paymaster ID
  };
}

const config: Config = {
  web3AuthClientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID || '',
  appName: import.meta.env.VITE_APP_NAME || 'WFounders',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  network: currentNetwork, // Full network configuration
  chainId: currentNetwork.chainId, // Legacy compatibility
  neyxtContractAddress: currentNetwork.contracts.neyxt,
  web3AuthNetwork: currentNetwork.web3AuthNetwork,
  // Supabase environment
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || '',
  },
  // AI service configuration - auto-selects based on environment
  ai: {
    // Build from resolved Supabase URL so generic keys work
    supabaseEdgeUrl: `${resolvedSupabaseUrl}/functions/v1/openai-chat`,
    fallbackApiUrl: '/api/chat',
    useSupabase: Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
  },
  // Buy flow configuration
  buyFlow: {
    // Feature flags - can be toggled per environment
    enableFiat: import.meta.env.VITE_FEATURE_ENABLE_FIAT === 'true',
    enableGasSponsorship: import.meta.env.VITE_FEATURE_ENABLE_GAS_SPONSORSHIP === 'true',
    enableCrossChain: import.meta.env.VITE_FEATURE_ENABLE_CROSS_CHAIN === 'true',
    // API configuration
    apiBaseUrl: import.meta.env.VITE_BUY_FLOW_API_BASE_URL || '/api',
    chainId: currentNetwork.chainId,
    neyxtAddress: currentNetwork.contracts.neyxt, // Auto-selects testnet/mainnet based on environment
    // All contract addresses (environment-specific via env files)
    contracts: {
      weth: import.meta.env.VITE_POLYGON_WETH_CONTRACT_ADDRESS || '',
      usdc: import.meta.env.VITE_POLYGON_USDC_CONTRACT_ADDRESS || '',
      quickswapFactory: import.meta.env.VITE_POLYGON_QUICKSWAP_FACTORY || '',
      quickswapRouter: import.meta.env.VITE_POLYGON_QUICKSWAP_ROUTER || '',
      refPoolAddress: import.meta.env.VITE_POLYGON_REF_POOL_ADDRESS || '',
      biconomyPaymaster: import.meta.env.VITE_POLYGON_BICONOMY_PAYMASTER || '',
    },
  }
};

export default config; 