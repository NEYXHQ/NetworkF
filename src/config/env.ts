interface Config {
  web3AuthClientId: string;
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
  network: 'mainnet' | 'testnet';
  chainId: string;
  neyxtContractAddress: string;
  web3AuthNetwork: 'sapphire_devnet' | 'sapphire_mainnet';
}

const getNetworkConfig = () => {
  // Auto-detect based on environment
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    // Development (localhost) = Testnet
    return {
      network: 'testnet' as const,
      chainId: '80002', // Polygon Amoy testnet
      contractAddress: import.meta.env.VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS || '',
      web3AuthNetwork: 'sapphire_devnet' as const
    };
  } else {
    // Production (cloud VM) = Mainnet
    return {
      network: 'mainnet' as const,
      chainId: '137', // Polygon mainnet
      contractAddress: import.meta.env.VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS || '',
      web3AuthNetwork: 'sapphire_mainnet' as const
    };
  }
};

const networkConfig = getNetworkConfig();

const config: Config = {
  web3AuthClientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID || '',
  appName: import.meta.env.VITE_APP_NAME || 'NetworkF2',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  network: networkConfig.network,
  chainId: networkConfig.chainId,
  neyxtContractAddress: networkConfig.contractAddress,
  web3AuthNetwork: networkConfig.web3AuthNetwork,
};

export default config; 