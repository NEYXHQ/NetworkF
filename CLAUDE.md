# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **WFounders**, a modern Web3 application built with React, TypeScript, and Vite that combines:
- **Web3Auth** for social authentication with automatic wallet creation
- **Supabase** for user management and database operations  
- **Ethereum blockchain** integration for WFOUNDER token transactions
- **Admin dashboard** for user approval workflows
- **AI-powered founder profiling** system

## Development Commands

### Core Development
```bash
npm run dev          # Start development server (localhost:5174)
npm run build        # Build for production (TypeScript + Vite)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint with TypeScript rules
```

### Environment Management
```bash
npm run env:validate # Comprehensive environment validation
npm run env:check    # Quick environment health check
npm run env:sync dev # Safe sync to development Supabase with confirmations
npm run env:sync prod # Safe sync to production Supabase with confirmations
```

### Legacy Supabase Integration
```bash
npm run secrets:dev  # Direct sync to dev (no safety checks)
npm run secrets:prod # Direct sync to prod (no safety checks)
```

## Architecture Overview

### Environment Auto-Switching
The application uses a **hybrid environment approach**:
- **Development** (`npm run dev`): Uses Ethereum Sepolia testnet + dev Supabase project + **testnet DeFi services**
- **Production** (deployed): Uses Ethereum mainnet + prod Supabase project + production DeFi services

**Architecture**: Uses Uniswap V2 for DEX functionality with proper testnet/mainnet separation for all services.

Configuration is managed through:
- `.env.development` - Local development settings
- `.env.production` - Production deployment settings  
- `src/config/env.ts` - Central configuration resolver
- `src/config/networks.ts` - Blockchain network configurations
- `ENVIRONMENT.md` - Hybrid environment documentation

### Key Architecture Components

**Authentication & Wallet (`src/contexts/`)**
- `Web3AuthProvider.tsx` - Manages Web3Auth initialization and user sessions
- Automatic wallet creation via MPC (Multi-Party Computation)
- Social login integration (LinkedIn, Google, GitHub)

**State Management (`src/hooks/`)**
- `useWeb3Auth.ts` - Web3Auth authentication state
- `useSupabaseUser.ts` - User profile and database operations
- `useTokenService.ts` - WFOUNDER token balance and transaction handling
- `useBuyNeyxt.ts` - Token purchase flow with direct AMM calculations

**Services (`src/services/`)**
- `adminService.ts` - User approval workflow management
- `profilerLLM.ts` - AI-powered founder profiling via OpenAI
- `paymasterService.ts` - Gasless transaction support via Biconomy
- `emailService.ts` - Transactional emails via Supabase Edge Functions

**Blockchain Integration (`src/config/`)**
- `contracts.ts` - Smart contract addresses and ABI management
- `networks.ts` - Ethereum mainnet/testnet RPC configurations
- Automatic network switching based on environment

### Database Schema (Supabase)
- `users` - Profile data, LinkedIn info, approval status, onboarding progress
- `connections` - User-to-user network connections
- `admin_users` - Admin access control
- `app_statistics` - Dashboard analytics

## Testing & Quality

### Running Tests
There are no automated tests configured. The project relies on:
- TypeScript compilation (`tsc -b`) for type checking
- ESLint for code quality (`npm run lint`)
- Manual testing in development environment

### Type Checking
```bash
npm run build  # Includes TypeScript compilation check
```

## Environment Configuration

### Required Frontend Environment Variables
All environment variables use `VITE_` prefix for frontend access:

**Core Authentication:**
- `VITE_WEB3AUTH_CLIENT_ID` - Web3Auth project client ID
- `VITE_APP_NAME` - Application display name

**Supabase (Database):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SUPABASE_PROJECT_ID` - Supabase project identifier

**Smart Contracts (Polygon):**
- `VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS` - WFOUNDER token contract
- `VITE_ETHEREUM_WETH_CONTRACT_ADDRESS` - Wrapped ETH contract
- `VITE_ETHEREUM_USDC_CONTRACT_ADDRESS` - USD Coin contract
- `VITE_ETHEREUM_UNISWAP_FACTORY` - Uniswap V2 factory
- `VITE_ETHEREUM_UNISWAP_ROUTER` - Uniswap V2 router for pool queries
- `VITE_ETHEREUM_REF_POOL_ADDRESS` - WETH/WFOUNDER liquidity pool
- `VITE_ETHEREUM_BICONOMY_PAYMASTER` - Gasless transaction paymaster
- `VITE_ETHEREUM_ALLOWED_ROUTERS` - Comma-separated router addresses for pool access

**Feature Flags (Optional):**
- `VITE_FEATURE_ENABLE_FIAT=false` - Fiat onramp integration
- `VITE_FEATURE_ENABLE_GAS_SPONSORSHIP=false` - Gasless transactions  
- `VITE_FEATURE_ENABLE_CROSS_CHAIN=false` - Cross-chain functionality

### Server-Side Secrets (Supabase)
These are stored as Supabase secrets and not exposed to frontend:
 
- `SUPA_BICONOMY_API_KEY` - Biconomy gasless transaction API
- `SUPA_BICONOMY_PAYMASTER_ID` - Biconomy paymaster application ID
- `SUPA_RESEND_API_KEY` - Email delivery service
- `SUPA_OPENAI_API_KEY` - AI profiling service
- `SUPA_TRANSAK_API_KEY` - Fiat onramp service
- `SUPA_ETHEREUM_RPC_URL` - Server-side RPC endpoint
- `SUPA_ETHEREUM_TREASURY_WALLET_PRIVATE_KEY` - Treasury wallet private key (CRITICAL - server only)
- `SUPA_NETWORK_ENVIRONMENT` - Server-side environment detection
- `SUPA_NODE_ENV` - Node environment variable
- `SUPA_ENVIRONMENT` - Environment configuration

## Key Development Patterns

### Component Structure
- **Pages** (`src/pages/`) - Route-level components (HomePage, AdminPage)
- **Components** (`src/components/`) - Organized by domain (auth/, wallet/, user/, ui/)
- **Hooks** (`src/hooks/`) - Custom React hooks for state management
- **Services** (`src/services/`) - Business logic abstraction layer

### State Management Pattern
The app uses React Context + custom hooks pattern:
```typescript
// 1. Provider wraps app
<Web3AuthProvider>
  <AppContent />  
</Web3AuthProvider>

// 2. Hooks consume context
const { user, isLoading } = useWeb3Auth();
const { profile, updateProfile } = useSupabaseUser();
```

### Network Handling
Automatic environment-based network switching:
```typescript
// Development: Ethereum Sepolia Testnet (chainId: 11155111)
// Production: Ethereum Mainnet (chainId: 1)
const network = currentNetwork; // Auto-selected based on import.meta.env.DEV
```

### Token Integration
WFOUNDER token operations via ethers.js:
```typescript
const { balance, sendToken, isLoading } = useTokenService();
const { getQuote, executeTrade } = useBuyNeyxt();
```

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Configure production environment variables in Vercel dashboard
3. Deploy - automatic build with `npm run build`

The app is 100% static and can deploy to any static hosting service (Netlify, AWS S3, etc.).

## Common Development Tasks

### Adding New Routes
1. Create page component in `src/pages/`
2. Add route to `src/App.tsx` Router configuration
3. Update navigation components if needed

### Integrating New Smart Contracts  
1. Add contract address to environment variables (testnet + mainnet)
2. Update `src/config/contracts.ts` with contract configuration
3. Create service in `src/services/` for contract interactions
4. Add React hook in `src/hooks/` for component integration

### Database Schema Changes
1. Update Supabase database via SQL editor
2. Regenerate types: Use Supabase CLI or manual update of `src/lib/database.types.ts`
3. Update service layer in `src/services/` for new fields
4. Update React hooks and components

### Adding New Environment Variables
1. Add to both `.env.development` and `.env.production`
2. Update `src/config/env.ts` configuration object  
3. If server-side: Use `npm run env:sync dev/prod` for safe syncing with confirmations
4. Update TypeScript types and validation in `scripts/validate-env.js` if needed
5. If hybrid service: Document in `ENVIRONMENT.md` and validation script

### Environment Management Workflow
1. **Before making changes**: `npm run env:validate`
2. **Make changes**: Edit `.env.development` and `.env.production`  
3. **Validate changes**: `npm run env:validate` 
4. **Sync to Supabase**: `npm run env:sync dev` then `npm run env:sync prod`
5. **Verify**: `npm run env:check`

## Git Commit Security

### Pre-Commit Security Validation
**CRITICAL**: Before creating any commit, verify that no private keys or secrets are included in the committed files:

1. **Check for sensitive data**: Scan all staged files for private keys, API keys, passwords, or other secrets
2. **Review environment files**: Ensure `.env.*` files are properly gitignored and not committed
3. **Validate against patterns**: Look for patterns like:
   - Private keys (starts with `0x` followed by 64 hex characters)
   - API keys and tokens
   - Database credentials
   - Wallet mnemonics or seed phrases
4. **Use git diff**: Review `git diff --staged` to see exactly what will be committed
5. **Abort if secrets found**: Never proceed with commit if any secrets are detected

**Remember**: Once committed to git history, secrets are extremely difficult to remove completely.

### Git Workflow and Remote Management
**Repository Setup**: This project has two remotes configured:
- **origin** (`AltoPal0/NetworkF2`): Development repository - stays in sync with local
- **NEYXHQ** (`NEYXHQ/NetworkF`): Production repository - updated manually when ready for deployment

**Commit and Push Workflow**:
1. **Local commits**: Create commits locally as normal
2. **Automatic push**: When asked to commit, always push to both local and origin
3. **Production deployment**: NEYXHQ is updated manually - DO NOT auto-push to NEYXHQ
4. **Commands used**:
   ```bash
   git add [files]
   git commit -m "commit message"
   git push origin main  # Push to development repo
   # NEYXHQ push is done manually when ready for production
   ```

**IMPORTANT**: Claude should never automatically push to NEYXHQ remote. Production deployments are handled manually.