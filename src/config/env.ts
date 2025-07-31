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
};

export default config; 