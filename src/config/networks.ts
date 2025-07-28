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
  iconUrls?: string[];
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
  iconUrls: ['https://polygon.technology/favicon.ico'],
  contracts: {
    neyxt: import.meta.env.VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS || '',
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
  iconUrls: ['https://polygon.technology/favicon.ico'],
  contracts: {
    neyxt: import.meta.env.VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS || '',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    ensUniversalResolver: '0xE4395e13d3c8f7F8895D4c3DA9a7e3c89e50AB95',
  },
  features: {
    eip1559: true,
    isTestnet: false,
  },
  web3AuthNetwork: 'sapphire_mainnet',
};

// Auto-detect current network based on environment
const getCurrentNetwork = (): NetworkConfig => {
  const isDev = import.meta.env.DEV;
  return isDev ? POLYGON_AMOY_TESTNET : POLYGON_MAINNET;
};

export const currentNetwork = getCurrentNetwork();
export const networks = {
  testnet: POLYGON_AMOY_TESTNET,
  mainnet: POLYGON_MAINNET,
};

export type { NetworkConfig }; 