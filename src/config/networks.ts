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
    wfounder: string;
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

const ETHEREUM_SEPOLIA_TESTNET: NetworkConfig = {
  chainId: '11155111',
  chainIdHex: '0xaa36a7',
  name: 'ethereum-sepolia',
  displayName: 'Ethereum Sepolia Testnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    public: [
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://rpc.sepolia.org',
      'https://rpc2.sepolia.org',
    ],
    backup: [
      'https://sepolia.blockpi.network/v1/rpc/public',
      'https://sepolia.gateway.tenderly.co',
      'https://gateway.tenderly.co/public/sepolia',
    ],
  },
  blockExplorerUrls: [
    'https://sepolia.etherscan.io',
    'https://sepolia.blockscout.com',
  ],
  iconUrls: ['https://ethereum.org/favicon.ico'],
  contracts: {
    wfounder: import.meta.env.VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS || '',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  },
  faucets: [
    'https://sepoliafaucet.com',
    'https://www.alchemy.com/faucets/ethereum-sepolia',
    'https://faucet.quicknode.com/ethereum/sepolia',
  ],
  features: {
    eip1559: true,
    isTestnet: true,
  },
  web3AuthNetwork: 'sapphire_devnet',
};

const ETHEREUM_MAINNET: NetworkConfig = {
  chainId: '1',
  chainIdHex: '0x1',
  name: 'ethereum',
  displayName: 'Ethereum Mainnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    public: [
      'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
    ],
    backup: [
      'https://ethereum-mainnet.public.blastapi.io',
      'https://ethereum-rpc.publicnode.com',
      'https://1rpc.io/eth',
    ],
  },
  blockExplorerUrls: [
    'https://etherscan.io',
    'https://ethereum.blockscout.com',
  ],
  iconUrls: ['https://ethereum.org/favicon.ico'],
  contracts: {
    wfounder: import.meta.env.VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS || '',
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
  return isDev ? ETHEREUM_SEPOLIA_TESTNET : ETHEREUM_MAINNET;
};

export const currentNetwork = getCurrentNetwork();

export const networks = {
  testnet: ETHEREUM_SEPOLIA_TESTNET,
  mainnet: ETHEREUM_MAINNET,
};

export type { NetworkConfig }; 