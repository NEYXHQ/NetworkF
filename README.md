# Wfounders - Modern Web3 App with Social Auth & Automatic Wallet Creation

A modern, fully static web application built with **Vite**, **React**, **TypeScript**, **Tailwind CSS 4.1**, **Web3Auth Plug-and-Play**, and **Supabase** for seamless social authentication, automatic wallet creation, and user management. Perfect for founders and entrepreneurs building Web3 networks.

## 🚀 Features

### 🔐 Authentication & Wallet
- **Web3Auth Plug-and-Play** - Social login (LinkedIn, Google, GitHub, etc.)
- **Automatic Wallet Creation** - Users get crypto wallets without seed phrases
- **Multi-Party Computation (MPC)** - Enterprise-grade key security
- **LinkedIn Integration** - Perfect for founder/entrepreneur networks

### 💰 Web3 & Token Integration
- **WFOUNDER Token Support** - Custom token for payments and features
- **Polygon Network** - Mainnet and Amoy Testnet support
- **Automatic Network Switching** - Seamless testnet/mainnet handling
- **Token Balance Display** - Real-time WFOUNDER and native token balances
- **Transaction Support** - Send WFOUNDER and native tokens

### 🗄️ Database & User Management
- **Supabase Integration** - PostgreSQL database with real-time features
- **Automatic Environment Switching** - Dev/Prod database selection
- **User Profile Management** - LinkedIn profile data storage
- **Approval Workflow** - Pending/Approved/Rejected user status
- **Row Level Security** - Secure data access policies
 - **Onboarding Flow** - Post-login survey + profile completion (see below)

### 🎨 UI/UX
- **Responsive Design** - Mobile-first approach with beautiful UI
- **Tailwind CSS 4.1** - Modern utility-first CSS framework
- **Environment Indicators** - Visual feedback for current environment
- **Network Mismatch Warnings** - Automatic network switching prompts
- **Debug Tools** - Development environment checker
 - **Faucet Links (Dev)** - Quick access to testnet faucets

### 🏗️ Architecture
- **100% Static** - Deploy anywhere (Vercel, Netlify, AWS S3, etc.)
- **TypeScript** - Full type safety throughout
- **Environment Auto-Detection** - Dev/Prod switching based on deployment
- **Developer Experience** - ESLint, Hot Module Replacement, comprehensive tooling

### 🧭 Onboarding Flow (UX)
- **Survey Modal** (`src/components/user/SurveyModal.tsx`): asks entity name + founding idea
- **Profile Completion Modal** (`src/components/user/ProfileCompletionModal.tsx`): “What are you looking for?” (co-founder, investors, mentors, etc.)
- **Storage**: `users.entity_name`, `users.founding_idea`, `users.survey_completed`, `users.looking_for`, `users.profile_completed`
- **Flow control** and persistence handled by `useSupabaseUser` hook and `userService`

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── debug/           # Debug and development tools
│   ├── layout/          # Layout components (Header, etc.)
│   ├── ui/              # Basic UI components (Button, etc.)
│   ├── user/            # User profile components
│   └── wallet/          # Wallet and token components
├── config/              # Environment and network configuration
├── contexts/            # Web3Auth context and provider
├── hooks/               # Custom React hooks
├── lib/                 # Library configurations (Supabase, etc.)
├── pages/               # Page components
├── services/            # Business logic services
└── types/               # TypeScript type definitions
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+ installed
- Web3Auth account (free tier available)
- Supabase account (free tier available)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   - Create a `.env` file at the project root (an example file is not committed).

3. **Configure your environment variables:**
   ```env
   # Web3Auth Configuration
   VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
   
   # App Configuration
   VITE_APP_NAME=Wfounders
   
   # Development Supabase (localhost)
   VITE_SUPABASE_DEV_URL=https://your-dev-project.supabase.co
   VITE_SUPABASE_DEV_ANON_KEY=your_dev_anon_key_here
   VITE_SUPABASE_DEV_PROJECT_ID=your_dev_project_id_here
   
   # Production Supabase (Vercel)
   VITE_SUPABASE_PROD_URL=https://your-prod-project.supabase.co
   VITE_SUPABASE_PROD_ANON_KEY=your_prod_anon_key_here
   VITE_SUPABASE_PROD_PROJECT_ID=your_prod_project_id_here
   
   # Smart Contract Addresses (Required - Auto-switch between testnet/mainnet)
   VITE_POLYGON_TESTNET_WFOUNDER_CONTRACT_ADDRESS=your_polygon_amoy_testnet_contract_address_here
   VITE_POLYGON_MAINNET_WFOUNDER_CONTRACT_ADDRESS=your_polygon_mainnet_contract_address_here
   VITE_POLYGON_TESTNET_WETH_CONTRACT_ADDRESS=your_polygon_amoy_testnet_weth_address_here
   VITE_POLYGON_MAINNET_WETH_CONTRACT_ADDRESS=0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270
   VITE_POLYGON_TESTNET_USDC_CONTRACT_ADDRESS=your_polygon_amoy_testnet_usdc_address_here
   VITE_POLYGON_MAINNET_USDC_CONTRACT_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
   # Note: POL is the native token of Polygon - no contract address needed
   
   # QuickSwap DEX Addresses (Required)
   VITE_POLYGON_TESTNET_QUICKSWAP_FACTORY=your_polygon_amoy_testnet_quickswap_factory_here
   VITE_POLYGON_MAINNET_QUICKSWAP_FACTORY=0x5757371414417b8C6CAad45bAeF941aBc173d036
   VITE_POLYGON_TESTNET_QUICKSWAP_ROUTER=your_polygon_amoy_testnet_quickswap_router_here
   VITE_POLYGON_MAINNET_QUICKSWAP_ROUTER=0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff
   
   # Buy Flow Pool & Paymaster (Required)
   VITE_POLYGON_TESTNET_REF_POOL_ADDRESS=your_polygon_amoy_testnet_weth_neyxt_pool_here
   VITE_POLYGON_MAINNET_REF_POOL_ADDRESS=your_polygon_mainnet_weth_neyxt_pool_here
   # Biconomy Paymaster Contract Addresses
   VITE_POLYGON_TESTNET_BICONOMY_PAYMASTER=your_polygon_amoy_testnet_paymaster_address_here
   VITE_POLYGON_MAINNET_BICONOMY_PAYMASTER=your_polygon_mainnet_paymaster_address_here
   VITE_POLYGON_TESTNET_ALLOWED_ROUTERS=your_polygon_amoy_testnet_router_addresses_here
   VITE_POLYGON_MAINNET_ALLOWED_ROUTERS=0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff
   
   # Buy Flow Feature Flags (Optional - defaults to false)
   VITE_FEATURE_ENABLE_FIAT=false
   VITE_FEATURE_ENABLE_GAS_SPONSORSHIP=false
   VITE_FEATURE_ENABLE_CROSS_CHAIN=false
   
   # Buy Flow Configuration (Optional - uses defaults if not set)
   VITE_BUY_FLOW_API_BASE_URL=/api
   VITE_CHAIN_ID=137
   # Note: All contract addresses automatically selected from VITE_POLYGON_*_*_ADDRESS variables
   # ⚠️  IMPORTANT: All contract address variables are required - no fallbacks provided
   
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5174`

## 🧩 Routes

- `/` - Home + onboarding flow (survey, profile completion) + wallet widget
- `/admin/login` - Admin login screen
- `/admin` - Admin dashboard (user approvals, connections, stats)

## 🔐 Web3Auth Setup

### Step 1: Create Web3Auth Account

1. **Sign up at [web3auth.io](https://web3auth.io)** (free tier available)
2. **Go to the Dashboard** and create a new project
3. **Select "Plug and Play"** - this gives you the modal with social logins
4. **Copy your Client ID** from the project settings

### Step 2: Configure Your Project

1. **Add your domain to Web3Auth dashboard:**
   - Development: `http://localhost:5174`
   - Production: `https://your-domain.com`

2. **Update your `.env` file:**
   ```env
   VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
   ```

## 🗄️ Supabase Setup

### Step 1: Create Supabase Projects

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Create two projects:**
   - **Development**: `networkf2-dev` (for localhost)
   - **Production**: `networkf2-prod` (for Vercel)

### Step 2: Set Up Database Schema

For both projects, run the SQL scripts:

1. **Copy `supabase-setup.sql`** → Paste in SQL Editor → Run
2. **Copy `fix-rls-policies.sql`** → Paste in SQL Editor → Run

If you plan to use the onboarding flow, also run the updates listed in the Profile Setup Guide (linked below) to add `looking_for` and `profile_completed` fields.

### Step 3: Get Project Credentials

For each project:
1. **Go to Settings → API**
2. **Copy Project URL, anon key, and Project ID**
3. **Add to your environment variables**

## 💰 WFOUNDER Token Setup

### Contract Addresses

Add your WFOUNDER token contract addresses:

```env
# Testnet (used automatically on localhost)
VITE_POLYGON_TESTNET_WFOUNDER_CONTRACT_ADDRESS=your_polygon_amoy_testnet_contract_address_here

# Mainnet (used automatically on cloud VM)
VITE_POLYGON_MAINNET_WFOUNDER_CONTRACT_ADDRESS=your_polygon_mainnet_contract_address_here
```

## 🔄 Environment Auto-Switching

The app automatically switches environments:

### Development (localhost)
- **Database**: Uses `VITE_SUPABASE_DEV_*` variables
- **Network**: Polygon Amoy Testnet
- **Web3Auth**: Sapphire Devnet
- **Tokens**: Testnet WFOUNDER contract

### Production (Vercel)
- **Database**: Uses `VITE_SUPABASE_PROD_*` variables
- **Network**: Polygon Mainnet
- **Web3Auth**: Sapphire Mainnet
- **Tokens**: Mainnet WFOUNDER contract

### Visual Indicators and Debugging (Dev)
- `EnvironmentChecker` (bottom-right in dev): shows current env, network, Supabase project
- Buttons to send test welcome/approval emails
- `NetworkIndicator` (header): displays chain; `NetworkMismatchWarning` prompts network switch
- `BalanceDebugger` (dev-only): fetches native and WFOUNDER balances, contract code checks

## 🚀 Deployment

### Vercel Deployment

1. **Connect your GitHub repository to Vercel**
2. **Add production environment variables:**
   ```env
   VITE_SUPABASE_PROD_URL=https://your-prod-project.supabase.co
   VITE_SUPABASE_PROD_ANON_KEY=your_prod_anon_key_here
   VITE_SUPABASE_PROD_PROJECT_ID=your_prod_project_id_here
   VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
   VITE_POLYGON_MAINNET_WFOUNDER_CONTRACT_ADDRESS=your_mainnet_contract_address
   ```
3. **Deploy** - Vercel will automatically use production settings

### Other Platforms

The app is 100% static and can be deployed to:
- **Netlify**
- **AWS S3 + CloudFront**
- **GitHub Pages**
- **Any static hosting service**

## 🎯 Key Features Explained

### 🔐 **Zero-Friction Web3 Onboarding**
Users sign in with familiar social accounts and automatically get:
- ✅ Authenticated session
- ✅ Crypto wallet (no seed phrases)
- ✅ Secure key management (MPC)
- ✅ Profile data stored in Supabase

### 💰 **WFOUNDER Token Integration**
- **Balance Display**: Real-time WFOUNDER and native token balances
- **Transaction Support**: Send WFOUNDER and native tokens
- **Network Auto-Switching**: Seamless testnet/mainnet handling
- **Contract Integration**: Direct interaction with WFOUNDER smart contracts

### 🗄️ **User Management System**
- **LinkedIn Profile Sync**: Automatic profile data import
- **Approval Workflow**: Admin can approve/reject users
- **Status Tracking**: Pending/Approved/Rejected states
- **Last Login Tracking**: User activity monitoring

### 🧭 **Onboarding (Survey + Profile Completion)**
- Collects entity name + founding idea (survey)
- Captures "what you’re looking for" to improve matching
- Non-blocking: users can skip and complete later
- See `PROFILE_SETUP_GUIDE.md` for DB updates and details

### 🔄 **Environment Intelligence**
- **Auto-Detection**: Dev/Prod environment switching
- **Database Selection**: Automatic dev/prod database selection
- **Network Selection**: Testnet/mainnet based on environment
- **Debug Tools**: Environment indicators and logging

## ✉️ Email Edge Functions (Supabase)

Two Supabase Edge Functions power onboarding emails:
- `send-welcome-email` – sent to new users
- `send-approval-email` – sent upon admin approval

Both functions use Resend for delivery. Configure `RESEND_API_KEY` as a Supabase function secret and deploy the functions.
- See `EMAIL_SETUP_GUIDE.md` for step-by-step setup, domain verification, and testing.
- In dev, the `EnvironmentChecker` includes buttons to trigger test emails.

## 🗃️ Database (Overview)

Core tables used by the app (see `src/lib/database.types.ts`):
- `users`: profile, LinkedIn data, approval status, admin flag, onboarding fields (`entity_name`, `founding_idea`, `survey_completed`, `looking_for`, `profile_completed`), usage metrics
- `connections`: network connections between users (pending/accepted/rejected/cancelled)
- `admin_users`: admin mapping and permissions
- `app_statistics`: aggregate stats for dashboard

## 🔧 Environment Variables Reference

### Required Variables

#### Core Authentication
- `VITE_WEB3AUTH_CLIENT_ID` - Web3Auth project client ID for social login
- `VITE_APP_NAME` - Application name displayed in UI

#### Supabase Configuration
- `VITE_SUPABASE_DEV_URL` - Development Supabase project URL
- `VITE_SUPABASE_DEV_ANON_KEY` - Development Supabase anonymous key
- `VITE_SUPABASE_DEV_PROJECT_ID` - Development Supabase project ID
- `VITE_SUPABASE_PROD_URL` - Production Supabase project URL
- `VITE_SUPABASE_PROD_ANON_KEY` - Production Supabase anonymous key
- `VITE_SUPABASE_PROD_PROJECT_ID` - Production Supabase project ID

#### Smart Contract Addresses (Required)
- `VITE_POLYGON_TESTNET_WFOUNDER_CONTRACT_ADDRESS` - WFOUNDER token address on Polygon Amoy testnet
- `VITE_POLYGON_MAINNET_WFOUNDER_CONTRACT_ADDRESS` - WFOUNDER token address on Polygon mainnet
- `VITE_POLYGON_TESTNET_WETH_CONTRACT_ADDRESS` - WETH token address on testnet
- `VITE_POLYGON_MAINNET_WETH_CONTRACT_ADDRESS` - WETH token address on mainnet
- `VITE_POLYGON_TESTNET_USDC_CONTRACT_ADDRESS` - USDC token address on testnet
- `VITE_POLYGON_MAINNET_USDC_CONTRACT_ADDRESS` - USDC token address on mainnet
- **Note**: POL is the native token of Polygon - no contract address needed
- `VITE_POLYGON_TESTNET_QUICKSWAP_FACTORY` - QuickSwap factory on testnet
- `VITE_POLYGON_MAINNET_QUICKSWAP_FACTORY` - QuickSwap factory on mainnet
- `VITE_POLYGON_TESTNET_QUICKSWAP_ROUTER` - QuickSwap router on testnet
- `VITE_POLYGON_MAINNET_QUICKSWAP_ROUTER` - QuickSwap router on mainnet
- `VITE_POLYGON_TESTNET_REF_POOL_ADDRESS` - WETH/WFOUNDER pool on testnet
- `VITE_POLYGON_MAINNET_REF_POOL_ADDRESS` - WETH/WFOUNDER pool on mainnet
- `VITE_POLYGON_TESTNET_BICONOMY_PAYMASTER` - Biconomy paymaster contract on testnet
- `VITE_POLYGON_MAINNET_BICONOMY_PAYMASTER` - Biconomy paymaster contract on mainnet
- **Note**: Biconomy uses singleton paymaster contracts per chain - your instance is identified by API key + paymaster ID in Supabase secrets
- `VITE_POLYGON_TESTNET_ALLOWED_ROUTERS` - Comma-separated router addresses on testnet
- `VITE_POLYGON_MAINNET_ALLOWED_ROUTERS` - Comma-separated router addresses on mainnet
- **Note**: All addresses automatically switch between testnet/mainnet based on environment (dev = testnet, prod = mainnet)
- **Important**: These variables are required - no fallback addresses are provided
- **Native Token**: POL is the native token of Polygon - use `networks.ts` for native currency info or `getNativeTokenAddress()` from `contracts.ts`

### Optional Variables (Buy Flow Features)

#### Feature Flags
- `VITE_FEATURE_ENABLE_FIAT` - Enable fiat onramp (default: false)
- `VITE_FEATURE_ENABLE_GAS_SPONSORSHIP` - Enable gasless transactions (default: false)
- `VITE_FEATURE_ENABLE_CROSS_CHAIN` - Enable cross-chain functionality (default: false)

#### Buy Flow Configuration
- `VITE_BUY_FLOW_API_BASE_URL` - API base URL for buy flow (default: /api)
- `VITE_CHAIN_ID` - Target blockchain chain ID (default: 137 for Polygon)
- `neyxtAddress` - Automatically uses testnet/mainnet address based on environment

### Supabase Secrets (Server-Side Only)
These variables are stored as secrets in Supabase and are NOT exposed to the frontend:

- `ZEROX_API_KEY` - 0x Swap API key for DEX aggregation ✅ **Configured**
- `BICONOMY_API_KEY` - Biconomy API key for gas sponsorship ✅ **Configured**
- `BICONOMY_PAYMASTER_ID` - Biconomy paymaster application ID ✅ **Configured**
- `ONRAMP_API_KEY` - Transak or Ramp API key for fiat onramp
- `ONRAMP_WEBHOOK_SECRET` - HMAC secret for webhook verification
- `ALCHEMY_OR_RPC_URL_POLYGON` - RPC endpoint for Polygon blockchain
- `REF_POOL_ADDRESS` - WETH/WFOUNDER reference pool address
- `ALLOWED_ROUTERS` - Comma-separated list of allowed DEX router addresses

### Environment Detection
The app automatically detects the environment:
- **Development**: Uses `VITE_SUPABASE_DEV_*` variables
- **Production**: Uses `VITE_SUPABASE_PROD_*` variables
- **Network Selection**: Automatically switches between testnet/mainnet based on environment

## 🛠️ Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Debug Features

- **Environment Checker**: Shows current environment (dev only)
- **Console Logs**: Database connection and network info
- **Network Indicator**: Current network in header
- **Network Mismatch Warning**: Automatic network switching
- **Faucet Links (Dev)**: Quick links to get testnet POL/ETH
- **Balance Debugger (Dev)**: Inspect balances and contract code

## 📚 Documentation

- **[Supabase Setup Guide](SUPABASE_SETUP_GUIDE.md)** - Complete database setup
- **[Environment Setup](ENVIRONMENT_SETUP.md)** - Environment configuration
- **[Email Setup Guide](EMAIL_SETUP_GUIDE.md)** - Resend + Supabase Edge Functions for emails
- **[Profile Setup Guide](PROFILE_SETUP_GUIDE.md)** - Onboarding survey + profile completion
- **[Web3Auth Documentation](https://web3auth.io/docs)** - Authentication setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the guides in this repository
- **Web3Auth**: [web3auth.io/docs](https://web3auth.io/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)

---

**Built with ❤️ for the Web3 community**

---

## Environment Configuration (Updated)

We now use generic env names with two files loaded by Vite based on mode:

- `.env.development` for local dev (`npm run dev`)
- `.env.production` for build/preview (`npm run build`, `npm run preview`)

Put the same keys in both files; only values differ.

Required frontend keys:

```env
VITE_WEB3AUTH_CLIENT_ID=
VITE_APP_NAME=

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PROJECT_ID=

VITE_POLYGON_WFOUNDER_CONTRACT_ADDRESS=
VITE_POLYGON_WETH_CONTRACT_ADDRESS=
VITE_POLYGON_USDC_CONTRACT_ADDRESS=
VITE_POLYGON_QUICKSWAP_FACTORY=
VITE_POLYGON_QUICKSWAP_ROUTER=
VITE_POLYGON_REF_POOL_ADDRESS=
VITE_POLYGON_BICONOMY_PAYMASTER=
VITE_POLYGON_ALLOWED_ROUTERS=0x...,0x...

VITE_FEATURE_ENABLE_FIAT=false
VITE_FEATURE_ENABLE_GAS_SPONSORSHIP=false
VITE_FEATURE_ENABLE_CROSS_CHAIN=false

VITE_BUY_FLOW_API_BASE_URL=/api
```

Server-only (Supabase secrets):

```env
ZEROX_API_KEY=
TRANSAK_API_KEY=
BICONOMY_API_KEY=
BICONOMY_PAYMASTER_ID=
RESEND_API_KEY=
OPENAI_API_KEY=
# Optional
ONRAMP_WEBHOOK_SECRET=
ALCHEMY_OR_RPC_URL_POLYGON=
```

Sync env files to Supabase:

```bash
npm run secrets:dev   # .env.development → dev project
npm run secrets:prod  # .env.production → prod project
```

Note: legacy `VITE_*_DEV_*`, `VITE_*_PROD_*`, `VITE_POLYGON_TESTNET_*`, and `VITE_POLYGON_MAINNET_*` are deprecated.
