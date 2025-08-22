# Configuration System Documentation

## Overview

The WFounders application uses a comprehensive auto-switching configuration system that automatically selects between development (testnet) and production (mainnet) environments based on `import.meta.env.DEV`.

## Configuration Files

### `config/env.ts`
Main configuration file that provides access to all environment variables through a unified interface.

```typescript
import config from './config/env';

// Access any configuration
console.log(config.supabase.url); // Auto-switches between DEV/PROD
console.log(config.buyFlow.contracts.weth); // Auto-switches addresses
console.log(config.web3AuthClientId); // Web3Auth configuration
```

### `config/networks.ts`
Network-specific configuration including RPC URLs, explorers, and contract addresses.

```typescript
import { currentNetwork, networks } from './config/networks';

// Current network (auto-selected)
console.log(currentNetwork.chainId); // '80002' in dev, '137' in prod
console.log(currentNetwork.contracts.neyxt); // Auto-switched contract address
```

### `config/contracts.ts`
Contract addresses and pricing policies with comprehensive helper functions.

```typescript
import { 
  getContractAddresses, 
  getAllContractAddresses,
  validateEnvironmentVariables,
  getFeatureFlags 
} from './config/contracts';

// Get all contract addresses
const contracts = getAllContractAddresses();

// Validate environment setup
const { isValid, missing } = validateEnvironmentVariables();
if (!isValid) {
  console.error('Missing environment variables:', missing);
}
```

## Environment Variables Coverage

All environment variables from `example.env.empty` are properly accessible through the config system:

### Authentication & Core
- `VITE_WEB3AUTH_CLIENT_ID` → `config.web3AuthClientId`
- `VITE_APP_NAME` → `config.appName`

### Supabase (Auto-switching)
- `VITE_SUPABASE_DEV_URL` / `VITE_SUPABASE_PROD_URL` → `config.supabase.url`
- `VITE_SUPABASE_DEV_ANON_KEY` / `VITE_SUPABASE_PROD_ANON_KEY` → `config.supabase.anonKey`
- `VITE_SUPABASE_DEV_PROJECT_ID` / `VITE_SUPABASE_PROD_PROJECT_ID` → `config.supabase.projectId`

### Contract Addresses (Auto-switching)
- `VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS` / `VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS` → `config.neyxtContractAddress`
- `VITE_POLYGON_TESTNET_WETH_CONTRACT_ADDRESS` / `VITE_POLYGON_MAINNET_WETH_CONTRACT_ADDRESS` → `config.buyFlow.contracts.weth`
- `VITE_POLYGON_TESTNET_USDC_CONTRACT_ADDRESS` / `VITE_POLYGON_MAINNET_USDC_CONTRACT_ADDRESS` → `config.buyFlow.contracts.usdc`

### DEX Configuration (Auto-switching)
- `VITE_POLYGON_TESTNET_QUICKSWAP_FACTORY` / `VITE_POLYGON_MAINNET_QUICKSWAP_FACTORY` → `config.buyFlow.contracts.quickswapFactory`
- `VITE_POLYGON_TESTNET_QUICKSWAP_ROUTER` / `VITE_POLYGON_MAINNET_QUICKSWAP_ROUTER` → `config.buyFlow.contracts.quickswapRouter`
- `VITE_POLYGON_TESTNET_REF_POOL_ADDRESS` / `VITE_POLYGON_MAINNET_REF_POOL_ADDRESS` → `config.buyFlow.contracts.refPoolAddress`

### Paymaster & Security (Auto-switching)
- `VITE_POLYGON_TESTNET_BICONOMY_PAYMASTER` / `VITE_POLYGON_MAINNET_BICONOMY_PAYMASTER` → `config.buyFlow.contracts.biconomyPaymaster`
- `VITE_POLYGON_TESTNET_ALLOWED_ROUTERS` / `VITE_POLYGON_MAINNET_ALLOWED_ROUTERS` → `config.buyFlow.contracts.allowedRouters`

### Feature Flags
- `VITE_FEATURE_ENABLE_FIAT` → `config.buyFlow.enableFiat`
- `VITE_FEATURE_ENABLE_GAS_SPONSORSHIP` → `config.buyFlow.enableGasSponsorship`
- `VITE_FEATURE_ENABLE_CROSS_CHAIN` → `config.buyFlow.enableCrossChain`
- `VITE_BUY_FLOW_API_BASE_URL` → `config.buyFlow.apiBaseUrl`

## Auto-Switching Logic

The configuration system automatically switches between development and production settings:

```typescript
// Environment detection
const isDev = import.meta.env.DEV;

// Auto-select appropriate values
const supabaseUrl = isDev 
  ? import.meta.env.VITE_SUPABASE_DEV_URL
  : import.meta.env.VITE_SUPABASE_PROD_URL;
```

## Helper Functions

### `validateEnvironmentVariables()`
Validates that all required environment variables are set for the current environment.

```typescript
const { isValid, missing } = validateEnvironmentVariables();
if (!isValid) {
  console.error('Missing environment variables:', missing);
}
```

### `getAllContractAddresses()`
Returns all contract addresses with environment info.

```typescript
const addresses = getAllContractAddresses();
console.log(addresses.environment); // 'testnet' or 'mainnet'
console.log(addresses.chainId); // '80002' or '137'
```

### `getFeatureFlags()`
Returns all feature flags.

```typescript
const flags = getFeatureFlags();
if (flags.enableFiat) {
  // Fiat onramp is enabled
}
```

## Memory Notes

- Web3Auth environment should always remain 'DEVNET' and never be switched to 'MAINNET' [[memory:5617829]]
- Environment variables are stored in .env and automatically switch between DEV and PROD based on config folder logic [[memory:6838729]]

## For Future AI Agents

**All environment variables from `example.env.empty` are properly accessible through the config system.** You do not need to:

1. ❌ Add new environment variable access patterns
2. ❌ Create duplicate environment switching logic
3. ❌ Assume variables are missing from Supabase or other platforms

**You should:**

1. ✅ Use the existing config objects: `config`, `currentNetwork`, `getContractAddresses()`
2. ✅ Use helper functions: `validateEnvironmentVariables()`, `getAllContractAddresses()`
3. ✅ Follow the auto-switching pattern for any new environment variables

The configuration system is complete and handles all environment variables from the project's environment file.
