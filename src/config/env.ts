import { currentNetwork, type NetworkConfig } from './networks';

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
      allowedRouters: string[];
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
  // Auto-select Supabase environment
  supabase: {
    url: import.meta.env.DEV 
      ? (import.meta.env.VITE_SUPABASE_DEV_URL || '')
      : (import.meta.env.VITE_SUPABASE_PROD_URL || ''),
    anonKey: import.meta.env.DEV
      ? (import.meta.env.VITE_SUPABASE_DEV_ANON_KEY || '')
      : (import.meta.env.VITE_SUPABASE_PROD_ANON_KEY || ''),
    projectId: import.meta.env.DEV
      ? (import.meta.env.VITE_SUPABASE_DEV_PROJECT_ID || '')
      : (import.meta.env.VITE_SUPABASE_PROD_PROJECT_ID || ''),
  },
  // AI service configuration - auto-selects based on environment
  ai: {
    supabaseEdgeUrl: import.meta.env.DEV
      ? `${import.meta.env.VITE_SUPABASE_DEV_URL || ''}/functions/v1/openai-chat`
      : `${import.meta.env.VITE_SUPABASE_PROD_URL || ''}/functions/v1/openai-chat`,
    fallbackApiUrl: '/api/chat',
    useSupabase: Boolean(
      import.meta.env.DEV 
        ? (import.meta.env.VITE_SUPABASE_DEV_URL && import.meta.env.VITE_SUPABASE_DEV_ANON_KEY)
        : (import.meta.env.VITE_SUPABASE_PROD_URL && import.meta.env.VITE_SUPABASE_PROD_ANON_KEY)
    ),
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
    // All contract addresses (auto-switching based on environment)
    contracts: {
      weth: import.meta.env.DEV
        ? (import.meta.env.VITE_POLYGON_TESTNET_WETH_CONTRACT_ADDRESS || '')
        : (import.meta.env.VITE_POLYGON_MAINNET_WETH_CONTRACT_ADDRESS || ''),
      usdc: import.meta.env.DEV
        ? (import.meta.env.VITE_POLYGON_TESTNET_USDC_CONTRACT_ADDRESS || '')
        : (import.meta.env.VITE_POLYGON_MAINNET_USDC_CONTRACT_ADDRESS || ''),
      quickswapFactory: import.meta.env.DEV
        ? (import.meta.env.VITE_POLYGON_TESTNET_QUICKSWAP_FACTORY || '')
        : (import.meta.env.VITE_POLYGON_MAINNET_QUICKSWAP_FACTORY || ''),
      quickswapRouter: import.meta.env.DEV
        ? (import.meta.env.VITE_POLYGON_TESTNET_QUICKSWAP_ROUTER || '')
        : (import.meta.env.VITE_POLYGON_MAINNET_QUICKSWAP_ROUTER || ''),
      refPoolAddress: import.meta.env.DEV
        ? (import.meta.env.VITE_POLYGON_TESTNET_REF_POOL_ADDRESS || '')
        : (import.meta.env.VITE_POLYGON_MAINNET_REF_POOL_ADDRESS || ''),
      biconomyPaymaster: import.meta.env.DEV
        ? (import.meta.env.VITE_POLYGON_TESTNET_BICONOMY_PAYMASTER || '')
        : (import.meta.env.VITE_POLYGON_MAINNET_BICONOMY_PAYMASTER || ''),
      allowedRouters: import.meta.env.DEV
        ? (import.meta.env.VITE_POLYGON_TESTNET_ALLOWED_ROUTERS?.split(',') || [])
        : (import.meta.env.VITE_POLYGON_MAINNET_ALLOWED_ROUTERS?.split(',') || []),
    },
  },
};

export default config; 