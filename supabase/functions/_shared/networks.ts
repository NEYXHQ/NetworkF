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
  contracts: {
    wfounder: Deno.env.get('VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS') || '',
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
  contracts: {
    wfounder: Deno.env.get('VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS') || '',
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

/**
 * Get current network configuration based on environment
 * Uses DEV environment variable to determine testnet vs mainnet
 */
export function getCurrentNetwork(): NetworkConfig {
  // In Edge Functions, we need to determine environment differently
  // We can use the presence of testnet vs mainnet contract addresses
  const hasGeneric = Boolean(Deno.env.get('VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS'));
  const hasTestnetWfounder = hasGeneric;
  const hasMainnetWfounder = hasGeneric;

  // If both are present, prefer testnet for development
  // If only one is present, use that one
  if (hasTestnetWfounder && !hasMainnetWfounder) {
    return ETHEREUM_SEPOLIA_TESTNET;
  } else if (hasMainnetWfounder && !hasTestnetWfounder) {
    return ETHEREUM_MAINNET;
  } else {
    // Default to testnet if both or neither are present
    return ETHEREUM_SEPOLIA_TESTNET;
  }
}

/**
 * Get additional contract addresses from environment
 */
export function getContractAddresses() {
  const network = getCurrentNetwork();
  const isTestnet = network.features.isTestnet;
  
  const wethAddress = Deno.env.get('VITE_ETHEREUM_WETH_CONTRACT_ADDRESS');

  const usdcAddress = Deno.env.get('VITE_ETHEREUM_USDC_CONTRACT_ADDRESS');

  const refPoolAddress = Deno.env.get('VITE_ETHEREUM_REF_POOL_ADDRESS');

  return {
    wfounder: network.contracts.wfounder,
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
  const alchemyUrl = Deno.env.get('SUPA_ETHEREUM_RPC_URL');
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
  testnet: ETHEREUM_SEPOLIA_TESTNET,
  mainnet: ETHEREUM_MAINNET,
};

export type { NetworkConfig };
