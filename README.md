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

### 🎨 UI/UX
- **Responsive Design** - Mobile-first approach with beautiful UI
- **Tailwind CSS 4.1** - Modern utility-first CSS framework
- **Environment Indicators** - Visual feedback for current environment
- **Network Mismatch Warnings** - Automatic network switching prompts
- **Debug Tools** - Development environment checker

### 🏗️ Architecture
- **100% Static** - Deploy anywhere (Vercel, Netlify, AWS S3, etc.)
- **TypeScript** - Full type safety throughout
- **Environment Auto-Detection** - Dev/Prod switching based on deployment
- **Developer Experience** - ESLint, Hot Module Replacement, comprehensive tooling

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

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

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
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5174`

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

### 🔄 **Environment Intelligence**
- **Auto-Detection**: Dev/Prod environment switching
- **Database Selection**: Automatic dev/prod database selection
- **Network Selection**: Testnet/mainnet based on environment
- **Debug Tools**: Environment indicators and logging

## 🛠️ Development

### Available Scripts

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

## 📚 Documentation

- **[Supabase Setup Guide](SUPABASE_SETUP_GUIDE.md)** - Complete database setup
- **[Environment Setup](ENVIRONMENT_SETUP.md)** - Environment configuration
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
