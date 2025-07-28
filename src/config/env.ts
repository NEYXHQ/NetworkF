import { currentNetwork, type NetworkConfig } from './networks';

interface Config {
  web3AuthClientId: string;
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
  // Comprehensive network data
  network: NetworkConfig;
  // Legacy compatibility for existing code
  chainId: string;
  neyxtContractAddress: string;
  web3AuthNetwork: 'sapphire_devnet' | 'sapphire_mainnet';
}

const config: Config = {
  web3AuthClientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID || '',
  appName: import.meta.env.VITE_APP_NAME || 'NetworkF2',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  // Full network configuration
  network: currentNetwork,
  // Legacy compatibility
  chainId: currentNetwork.chainId,
  neyxtContractAddress: currentNetwork.contracts.neyxt,
  web3AuthNetwork: currentNetwork.web3AuthNetwork,
};

export default config; 