# Wfounders - Modern Web3 App with Social Auth & Automatic Wallet Creation

A modern, fully static web application built with **Vite**, **React**, **TypeScript**, **Tailwind CSS 4.1**, **Web3Auth Plug-and-Play**, and **Supabase** for seamless social authentication, automatic wallet creation, and user management. Perfect for founders and entrepreneurs building Web3 networks.

## 🚀 Features

### 🔐 Authentication & Wallet
- **Web3Auth Plug-and-Play** - Social login (LinkedIn, Google, GitHub, etc.)
- **Automatic Wallet Creation** - Users get crypto wallets without seed phrases
- **Multi-Party Computation (MPC)** - Enterprise-grade key security
- **LinkedIn Integration** - Perfect for founder/entrepreneur networks

### 💰 Web3 & Token Integration
- **NEYXT Token Support** - Custom token for payments and features
- **Polygon Network** - Mainnet and Amoy Testnet support
- **Automatic Network Switching** - Seamless testnet/mainnet handling
- **Token Balance Display** - Real-time NEYXT and native token balances
- **Transaction Support** - Send NEYXT and native tokens

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
   
   # NEYXT Token Contract Addresses
   VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS=your_polygon_amoy_testnet_contract_address_here
   VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS=your_polygon_mainnet_contract_address_here
   
   # Buy Flow Feature Flags (Optional - defaults to false)
   VITE_FEATURE_ENABLE_FIAT=false
   VITE_FEATURE_ENABLE_GAS_SPONSORSHIP=false
   VITE_FEATURE_ENABLE_CROSS_CHAIN=false
   
   # Buy Flow Configuration (Optional - uses defaults if not set)
   VITE_BUY_FLOW_API_BASE_URL=/api
   VITE_CHAIN_ID=137
   # Note: NEYXT address automatically selected from VITE_POLYGON_*_NEYXT_CONTRACT_ADDRESS
   
   # Legacy/Unused Variables (can be removed)
   # VITE_API_URL=http://localhost:3001/api
   # VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
   # VITE_RESEND_API_KEY=your_resend_api_key_here
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

## 💰 NEYXT Token Setup

### Contract Addresses

Add your NEYXT token contract addresses:

```env
# Testnet (used automatically on localhost)
VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS=your_polygon_amoy_testnet_contract_address_here

# Mainnet (used automatically on cloud VM)
VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS=your_polygon_mainnet_contract_address_here
```

## 🔄 Environment Auto-Switching

The app automatically switches environments:

### Development (localhost)
- **Database**: Uses `VITE_SUPABASE_DEV_*` variables
- **Network**: Polygon Amoy Testnet
- **Web3Auth**: Sapphire Devnet
- **Tokens**: Testnet NEYXT contract

### Production (Vercel)
- **Database**: Uses `VITE_SUPABASE_PROD_*` variables
- **Network**: Polygon Mainnet
- **Web3Auth**: Sapphire Mainnet
- **Tokens**: Mainnet NEYXT contract

### Visual Indicators and Debugging (Dev)
- `EnvironmentChecker` (bottom-right in dev): shows current env, network, Supabase project
- Buttons to send test welcome/approval emails
- `NetworkIndicator` (header): displays chain; `NetworkMismatchWarning` prompts network switch
- `BalanceDebugger` (dev-only): fetches native and NEYXT balances, contract code checks

## 🚀 Deployment

### Vercel Deployment

1. **Connect your GitHub repository to Vercel**
2. **Add production environment variables:**
   ```env
   VITE_SUPABASE_PROD_URL=https://your-prod-project.supabase.co
   VITE_SUPABASE_PROD_ANON_KEY=your_prod_anon_key_here
   VITE_SUPABASE_PROD_PROJECT_ID=your_prod_project_id_here
   VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
   VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS=your_mainnet_contract_address
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

### 💰 **NEYXT Token Integration**
- **Balance Display**: Real-time NEYXT and native token balances
- **Transaction Support**: Send NEYXT and native tokens
- **Network Auto-Switching**: Seamless testnet/mainnet handling
- **Contract Integration**: Direct interaction with NEYXT smart contracts

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

#### Smart Contract Addresses
- `VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS` - NEYXT token address on Polygon Amoy testnet
- `VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS` - NEYXT token address on Polygon mainnet
- **Note**: These are automatically selected based on environment (dev = testnet, prod = mainnet)

### Optional Variables (Buy Flow Features)

#### Feature Flags
- `VITE_FEATURE_ENABLE_FIAT` - Enable fiat onramp (default: false)
- `VITE_FEATURE_ENABLE_GAS_SPONSORSHIP` - Enable gasless transactions (default: false)
- `VITE_FEATURE_ENABLE_CROSS_CHAIN` - Enable cross-chain functionality (default: false)

#### Buy Flow Configuration
- `VITE_BUY_FLOW_API_BASE_URL` - API base URL for buy flow (default: /api)
- `VITE_CHAIN_ID` - Target blockchain chain ID (default: 137 for Polygon)
- `neyxtAddress` - Automatically uses testnet/mainnet address based on environment

### Legacy/Unused Variables
These variables exist in the codebase but are not currently used:
- `VITE_API_URL` - Legacy API URL (unused)
- `VITE_LINKEDIN_CLIENT_ID` - LinkedIn OAuth (unused)
- `VITE_RESEND_API_KEY` - Email service (unused, moved to Supabase secrets)

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
