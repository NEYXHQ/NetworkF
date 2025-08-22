// Network configuration for Edge Functions (Deno)
// Mirrors the configuration from src/config/networks.ts but in a Deno-compatible format
// Minimal Deno typing for linting in Node tooling
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

interface NetworkConfig {
  chainId: string;
  chainIdHex: string;
  name: string;
  displayName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: string[];
    public: string[];
    backup: string[];
  };
  blockExplorerUrls: string[];
  contracts: {
    neyxt: string;
    multicall?: string;
    ensRegistry?: string;
    ensUniversalResolver?: string;
  };
  faucets?: string[];
  features: {
    eip1559: boolean;
    isTestnet: boolean;
  };
  web3AuthNetwork: 'sapphire_devnet' | 'sapphire_mainnet';
}

const POLYGON_AMOY_TESTNET: NetworkConfig = {
  chainId: '80002',
  chainIdHex: '0x13882',
  name: 'polygon-amoy',
  displayName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'Polygon',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: {
    default: ['https://rpc-amoy.polygon.technology'],
    public: [
      'https://rpc-amoy.polygon.technology',
      'https://polygon-amoy.drpc.org',
      'https://rpc.ankr.com/polygon_amoy',
    ],
    backup: [
      'https://polygon-amoy-bor-rpc.publicnode.com',
      'https://polygon-amoy.gateway.tenderly.co',
      'https://gateway.tenderly.co/public/polygon-amoy',
    ],
  },
  blockExplorerUrls: [
    'https://amoy.polygonscan.com',
    'https://polygon-amoy.blockscout.com',
  ],
  contracts: {
    neyxt: Deno.env.get('VITE_POLYGON_NEYXT_CONTRACT_ADDRESS') || '',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },
  faucets: [
    'https://faucet.polygon.technology',
    'https://www.alchemy.com/faucets/polygon-amoy',
    'https://faucet.quicknode.com/polygon/amoy',
  ],
  features: {
    eip1559: true,
    isTestnet: true,
  },
  web3AuthNetwork: 'sapphire_devnet',
};

const POLYGON_MAINNET: NetworkConfig = {
  chainId: '137',
  chainIdHex: '0x89',
  name: 'polygon',
  displayName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'Polygon',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: {
    default: ['https://polygon-rpc.com'],
    public: [
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon',
      'https://poly-rpc.gateway.pokt.network',
    ],
    backup: [
      'https://polygon-mainnet.public.blastapi.io',
      'https://polygon-bor-rpc.publicnode.com',
      'https://1rpc.io/matic',
    ],
  },
  blockExplorerUrls: [
    'https://polygonscan.com',
    'https://polygon.blockscout.com',
  ],
  contracts: {
    neyxt: Deno.env.get('VITE_POLYGON_NEYXT_CONTRACT_ADDRESS') || '',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    ensUniversalResolver: '0xE4395e13d3c8f7F8895D4c3DA9a7e3c89e50AB95',
  },
  features: {
    eip1559: true,
    isTestnet: false,
  },
  web3AuthNetwork: 'sapphire_devnet',
};

/**
 * Get current network configuration based on environment
 * Uses DEV environment variable to determine testnet vs mainnet
 */
export function getCurrentNetwork(): NetworkConfig {
  // In Edge Functions, we need to determine environment differently
  // We can use the presence of testnet vs mainnet contract addresses
  const hasGeneric = Boolean(Deno.env.get('VITE_POLYGON_NEYXT_CONTRACT_ADDRESS'));
  const hasTestnetNeyxt = hasGeneric;
  const hasMainnetNeyxt = hasGeneric;
  
  // If both are present, prefer testnet for development
  // If only one is present, use that one
  if (hasTestnetNeyxt && !hasMainnetNeyxt) {
    return POLYGON_AMOY_TESTNET;
  } else if (hasMainnetNeyxt && !hasTestnetNeyxt) {
    return POLYGON_MAINNET;
  } else {
    // Default to testnet if both or neither are present
    return POLYGON_AMOY_TESTNET;
  }
}

/**
 * Get additional contract addresses from environment
 */
export function getContractAddresses() {
  const network = getCurrentNetwork();
  const isTestnet = network.features.isTestnet;
  
  const wethAddress = Deno.env.get('VITE_POLYGON_WETH_CONTRACT_ADDRESS');
    
  const usdcAddress = Deno.env.get('VITE_POLYGON_USDC_CONTRACT_ADDRESS');
    
  const refPoolAddress = Deno.env.get('VITE_POLYGON_REF_POOL_ADDRESS');

  return {
    neyxt: network.contracts.neyxt,
    weth: wethAddress || '',
    usdc: usdcAddress || '',
    refPool: refPoolAddress || '',
  };
}

/**
 * Get RPC URL with fallback strategy
 */
export function getRpcUrl(): string {
  const network = getCurrentNetwork();
  
  // Try Alchemy URL first if provided
  const alchemyUrl = Deno.env.get('ALCHEMY_OR_RPC_URL_POLYGON');
  if (alchemyUrl) {
    return alchemyUrl;
  }
  
  // Fallback to default RPC URLs from network config
  const defaultUrl = network.rpcUrls.default[0];
  if (defaultUrl) {
    return defaultUrl;
  }
  
  // Fallback to public RPC URLs
  const publicUrl = network.rpcUrls.public[0];
  if (publicUrl) {
    return publicUrl;
  }
  
  throw new Error(`No RPC URL available for network ${network.name}`);
}

export const networks = {
  testnet: POLYGON_AMOY_TESTNET,
  mainnet: POLYGON_MAINNET,
};

export type { NetworkConfig };
