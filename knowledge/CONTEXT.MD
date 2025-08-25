# WFounders - Web3 Founder Network Platform

## 🏗️ Architecture Overview

**WFounders** is a modern Web3 application that creates a global network of verified company founders. Built with a **React + TypeScript + Vite** frontend, **Web3Auth** for social authentication, **Supabase** for backend services, and **Polygon blockchain** for token operations.

The platform combines traditional social networking with Web3 capabilities while keeping blockchain complexity invisible to end users. **Currently implementing a comprehensive NEYXT token purchase flow** that allows users to buy tokens using crypto or fiat with gas fees paid in NEYXT.


### Buy Flow Architecture (NEW)
```
┌─────────────────────────────────────────────────────────────┐
│                    NEYXT Purchase Flow                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Frontend  │ │   Backend   │ │    Providers        │  │
│  │             │ │             │ │                     │  │
│  │ • Buy Modal │ │ • Quote API │ │ • 0x Swap API       │  │
│  │ • Asset Sel │ │ • Execute   │ │ • Transak Onramp    │  │
│  │ • Confirm   │ │ • Status    │ │ • Biconomy Paymaster│  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```
## 🔧 Technology Stack

### Frontend
- **React 19.1.0** - Modern React with latest features
- **TypeScript 5.8.3** - Full type safety
- **Vite 7.0.4** - Fast build tool and dev server
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **React Router DOM 7.7.0** - Client-side routing

### Authentication & Web3
- **Web3Auth Modal 10.0.6** - Social authentication
- **Ethers.js 6.15.0** - Ethereum library
- **Polygon Network** - Mainnet and testnet support

### Backend & Database
- **Supabase** - PostgreSQL database with real-time features
- **Edge Functions** - Serverless backend functions

### Buy Flow Providers (NEW)
- **0x Swap API** - Primary swap aggregator for Polygon
- **Transak** - Primary fiat onramp provider
- **Biconomy Token Paymaster** - Gasless transactions with NEYXT fees
- **QuickSwap v2** - Reference DEX for WETH/NEYXT pricing

### Development Tools
- **ESLint 9.30.1** - Code quality and consistency
- **TypeScript ESLint** - TypeScript-specific linting
- **Vite Plugins** - React and Tailwind integration

### Key Fields
```sql
-- Users table with onboarding fields
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT,
  linkedin_id TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  entity_name TEXT,           -- From survey
  founding_idea TEXT,          -- From survey
  survey_completed BOOLEAN,    -- Survey completion flag
  looking_for TEXT,            -- From profile completion
  profile_completed BOOLEAN,   -- Profile completion flag
  profiler_profile_name TEXT,  -- AI profiling result
  profiler_confidence NUMERIC, -- AI confidence score
  is_admin BOOLEAN,            -- Admin privileges
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Buy Flow tracking (NEW)
CREATE TABLE buy_flow_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_type TEXT,           -- 'crypto' or 'fiat'
  pay_asset TEXT,              -- USDC, POL, ETH, FIAT
  amount_in DECIMAL,
  amount_out_est DECIMAL,
  status TEXT,                 -- 'pending', 'completed', 'failed'
  route_id TEXT,
  tx_ids TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Buy Flow Security (NEW)
- **Price Validation**: Reference pool checks prevent manipulation
- **Slippage Protection**: Maximum 1% slippage tolerance
- **Router Allowlisting**: Only verified DEX routers allowed
- **HMAC Webhooks**: Secure onramp webhook verification
- **Rate Limiting**: Per-wallet daily purchase caps

### Data Security
- **Environment Isolation**: Separate dev/prod databases
- **API Key Management**: Secure environment variable handling
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: Type-safe data handling


### Environment Variables
Use generic names in both env files. The values differ per file.

```bash
# Shared (frontend) — placed in .env.development and .env.production
VITE_WEB3AUTH_CLIENT_ID=
VITE_APP_NAME=

# Supabase (frontend)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PROJECT_ID=

# Feature flags
VITE_FEATURE_ENABLE_FIAT=false
VITE_FEATURE_ENABLE_GAS_SPONSORSHIP=false
VITE_FEATURE_ENABLE_CROSS_CHAIN=false

# Buy Flow (contracts & DEX)
VITE_POLYGON_NEYXT_CONTRACT_ADDRESS=
VITE_POLYGON_WETH_CONTRACT_ADDRESS=
VITE_POLYGON_USDC_CONTRACT_ADDRESS=
VITE_POLYGON_QUICKSWAP_FACTORY=
VITE_POLYGON_QUICKSWAP_ROUTER=
VITE_POLYGON_REF_POOL_ADDRESS=
VITE_POLYGON_BICONOMY_PAYMASTER=
VITE_POLYGON_ALLOWED_ROUTERS=0x...,0x...

# Server-only (Supabase secrets)
ZEROX_API_KEY=
TRANSAK_API_KEY=
BICONOMY_API_KEY=
BICONOMY_PAYMASTER_ID=
RESEND_API_KEY=
OPENAI_API_KEY=
# Optional
ONRAMP_WEBHOOK_SECRET=
```

Sync env files to Supabase secrets per project:

```bash
supabase secrets set --project-ref kxepoivhqnurxmkgiojo --env-file .env.development   # uses .env.development → dev project
supabase secrets set --project-ref mnmlmectnlcrbnlhxyrp --env-file .env.production  # uses .env.production → prod project
```

## 🧪 Development Features

### Debug Tools (Development Only)
- **Environment Checker**: Shows current environment status
- **Balance Debugger**: Inspects token balances and contracts
- **Network Indicator**: Displays current blockchain network

## 📊 Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Tree Shaking**: Unused code elimination
- **Bundle Optimization**: Vite production builds