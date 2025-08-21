# WFounders - Web3 Founder Network Platform

## 🏗️ Architecture Overview

**WFounders** is a modern Web3 application that creates a global network of verified company founders. Built with a **React + TypeScript + Vite** frontend, **Web3Auth** for social authentication, **Supabase** for backend services, and **Polygon blockchain** for token operations.

The platform combines traditional social networking with Web3 capabilities while keeping blockchain complexity invisible to end users. **Currently implementing a comprehensive NEYXT token purchase flow** that allows users to buy tokens using crypto or fiat with gas fees paid in NEYXT.

## 🎯 Core Concept

WFounders addresses the "noise" in traditional founder networks by providing:
- **Verified founder-only access** through LinkedIn authentication
- **Web3-powered transparency** without exposing users to blockchain complexity
- **Value creation** rather than value extraction from members
- **Global founder community** with authentic connections
- **NEYXT Token Economy** - Platform token for features and gasless transactions

## 🏛️ System Architecture

### Frontend Layer
```
┌─────────────────────────────────────────────────────────────┐
│                    React + TypeScript                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Pages     │ │ Components  │ │      Hooks          │  │
│  │             │ │             │ │                     │  │
│  │ • HomePage  │ │ • UI        │ │ • useWeb3Auth       │  │
│  │ • AdminPage │ │ • Layout    │ │ • useSupabaseUser   │  │
│  │ • Auth      │ │ • User      │ │ • useTokenService   │  │
│  └─────────────┘ │ • Wallet    │ │ • useAdmin          │  │
│                  └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Authentication & Web3 Layer
```
┌─────────────────────────────────────────────────────────────┐
│                   Web3Auth + Ethers                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │ Web3Auth    │ │   Context   │ │    Token Service    │  │
│  │ Provider    │ │             │ │                     │  │
│  │             │ │ • Provider  │ │ • NEYXT Balance     │  │
│  │ • LinkedIn  │ │ • User Info │ │ • Native Balance    │  │
│  │ • Social    │ │ • Wallet    │ │ • Transactions      │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Backend Services Layer
```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase + Edge Functions               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │  Database   │ │ Edge Funcs  │ │    Email Service    │  │
│  │             │ │             │ │                     │  │
│  │ • Users     │ │ • OpenAI    │ │ • Welcome Emails    │  │
│  │ • Profiles  │ │ • Chat      │ │ • Approval Emails   │  │
│  │ • Admin     │ │ • CORS      │ │ • Resend API        │  │
│  │ • Buy Flow  │ │ • Quote     │ │ • Buy Flow APIs     │  │
│  │ • Analytics │ │ • Execute   │ │ • Onramp Webhooks   │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Blockchain Layer
```
┌─────────────────────────────────────────────────────────────┐
│                    Polygon Network                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Testnet   │ │  Mainnet    │ │    Smart Contracts  │  │
│  │             │ │             │ │                     │  │
│  │ • Amoy      │ │ • Polygon   │ │ • NEYXT Token       │  │
│  │ • Faucets   │ │ • RPC URLs  │ │ • ERC-20 Standard   │  │
│  │ • Dev Tools │ │ • Explorer  │ │ • Balance Checks    │  │
│  │ • Buy Flow  │ │ • Buy Flow  │ │ • QuickSwap Pool    │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

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

## 📁 Project Structure

```
NetworkF/
├── src/
│   ├── components/
│   │   ├── debug/
│   │   │   ├── BalanceDebugger.tsx
│   │   │   └── EnvironmentChecker.tsx
│   │   ├── layout/
│   │   │   └── Header.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── NetworkIndicator.tsx
│   │   │   └── QuoteBreakdown.tsx                 # 🧩 [M4.4] Scaffolded - Quote display UI ready
│   │   ├── user/
│   │   │   ├── AIProfilingModal.tsx
│   │   │   ├── ProfileCompletionModal.tsx
│   │   │   ├── SurveyModal.tsx
│   │   │   └── UserProfile.tsx
│   │   └── wallet/
│   │       ├── FaucetLinks.tsx
│   │       ├── NetworkMismatchWarning.tsx
│   │       ├── TokenBalance.tsx
│   │       ├── BuyNeyxtModal.tsx                  # 🧩 [M6.1] Scaffolded - 3-step buy flow ready
│   │       ├── GaslessBadge.tsx                   # 🧩 [M6.3] Scaffolded - Gas fee display ready
│   │       └── OnrampWidget.tsx                   # 🧩 [M7.1] Scaffolded - Transak widget ready
│   ├── config/
│   │   ├── env.ts                                 # ✅ [M1.2] Complete - All provider API keys configured
│   │   ├── networks.ts                            # ✅ [M1.3] Complete - Polygon mainnet + Amoy configured
│   │   └── contracts.ts                           # ✅ [M1.1] Complete - All contract addresses configured
│   │                                              # ✅ [M2.2] Complete - NEYXT/WETH/router addresses configured
│   │                                              # ✅ [M2.3] Complete - QuickSwap v2 WETH/NEYXT pool configured
│   │                                              # ✅ [M3.1] Complete - Reference DEX and policy bounds set
│   ├── contexts/
│   │   ├── Web3AuthContext.ts
│   │   ├── Web3AuthProvider.tsx
│   │   └── BuyFlowProvider.tsx                    # TODO [M6.2] (optional) shared state for modal steps
│   ├── features/
│   │   └── profiler/
│   │       └── FounderProfiler.tsx
│   ├── hooks/
│   │   ├── ethersRPC.ts
│   │   ├── useAdmin.ts
│   │   ├── useSupabaseUser.ts
│   │   ├── useTokenService.ts
│   │   ├── useWeb3Auth.ts
│   │   ├── useBuyNeyxt.ts                         # 🧩 [M5.5] Scaffolded - Buy orchestration ready
│   │   ├── useQuote.ts                            # 🧩 [M4.2] Scaffolded - Quote API calls ready
│   │   └── useOnrampEvents.ts                     # 🧩 [M7.3] Scaffolded - Onramp event handling ready
│   ├── lib/
│   │   ├── database.types.ts
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── AdminLoginPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── HomePage.tsx                           # TODO [M6.1] Add "Buy NEYXT" CTA entry point
│   ├── services/
│   │   ├── adminService.ts
│   │   ├── emailService.ts
│   │   ├── profilerLLM.ts
│   │   ├── profilerService.ts
│   │   ├── userService.ts
│   │   ├── analytics.ts                           # 🧩 [M6.4] Scaffolded - Analytics events ready
│   │   ├── onrampService.ts                       # 🧩 [M7.4] Scaffolded - Onramp integration ready
│   │   ├── paymasterService.ts                    # 🧩 [M5.4] Scaffolded - Biconomy integration ready
│   │   └── swapService.ts                         # 🧩 [M4.2] Scaffolded - Swap API calls ready
│   └── types/
│       ├── auth.ts
│       ├── buy.ts                                 # 🧩 [M4.3] Scaffolded - Quote/Route/Status types ready
│       └── rollup-plugin-polyfill-node.d.ts
├── supabase/
│   └── functions/
│       ├── _shared/
│       │   ├── cors.ts
│       │   ├── hmac.ts                            # 🧩 [M7.2] Scaffolded - HMAC verification ready
│       │   ├── paymaster.ts                       # 🧩 [M5.1] Scaffolded - Biconomy helpers ready
│       │   └── pricing.ts                         # 🧩 [M3.2] Scaffolded - Pool price fetching ready
│       ├── openai-chat/
│       ├── send-approval-email/
│       ├── send-welcome-email/
│       ├── execute/                               # 🧩 [M5.2] Scaffolded - Swap execution ready
│       ├── onramp-webhook/                        # 🧩 [M7.2] Enhanced - Transak webhook integration started
│       ├── quote/                                 # 🧩 [M4.1] Scaffolded - 0x quote API ready
│       └── status/                                # 🧩 [M5.3] Scaffolded - Transaction status ready
├── knowledge/
│   ├── FounderProfiler/
│   └── buyFlow/                                   # ✅ Complete - Comprehensive buy flow documentation
├── public/
├── Configuration files
└── README-BUY-FLOW.md                              # ✅ [M1.1] Complete - Overview, flags, runbooks & milestones
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
- **MPC Wallets** - Multi-party computation security

### Backend & Database
- **Supabase** - PostgreSQL database with real-time features
- **Edge Functions** - Serverless backend functions
- **Resend API** - Email delivery service
- **OpenAI API** - AI-powered profiling

### Buy Flow Providers (NEW)
- **0x Swap API** - Primary swap aggregator for Polygon
- **Transak** - Primary fiat onramp provider
- **Biconomy Token Paymaster** - Gasless transactions with NEYXT fees
- **QuickSwap v2** - Reference DEX for WETH/NEYXT pricing

### Development Tools
- **ESLint 9.30.1** - Code quality and consistency
- **TypeScript ESLint** - TypeScript-specific linting
- **Vite Plugins** - React and Tailwind integration

## 🚀 Key Features

### 1. **Social Authentication System**
- LinkedIn integration for founder verification
- Automatic wallet creation without seed phrases
- Multi-party computation (MPC) security
- Seamless Web3 onboarding

### 2. **Founder Profiling Engine**
- Adaptive questionnaire system
- AI-powered response mapping
- Profile confidence scoring
- Multi-dimensional founder categorization

### 3. **Onboarding Flow**
- **Survey Modal**: Collects entity name and founding idea
- **Profile Completion**: Captures user goals and needs
- **Non-blocking**: Users can skip and complete later
- **Progressive disclosure**: Step-by-step profile building

### 4. **Token Economy**
- **NEYXT Token**: Custom ERC-20 token for platform features
- **Balance Management**: Real-time token and native balance display
- **Transaction Support**: Send NEYXT and native tokens
- **Network Auto-switching**: Seamless testnet/mainnet handling

### 5. **NEYXT Purchase Flow (NEW)**
- **3-Step Process**: Select asset → Get quote → Confirm purchase
- **Multi-Asset Support**: USDC, POL, ETH, and Fiat onramp
- **Gasless Transactions**: Fees paid in NEYXT via Biconomy
- **Price Protection**: Reference pool validation and slippage controls
- **Auto-Swap**: Fiat purchases automatically convert to NEYXT

### 6. **Admin Dashboard**
- User approval workflow (pending/approved/rejected)
- Connection management between users
- Statistics and analytics
- User status management

### 7. **Email Automation**
- Welcome emails for new users
- Approval notifications
- Environment-aware email templates
- Resend API integration

## 🔄 Data Flow Architecture

```
User Action → React Component → Hook → Service → External API
     ↓              ↓           ↓       ↓         ↓
  LinkedIn    → Web3Auth → Supabase → Database → Blockchain
  Login           Auth      Profile    Storage    Tokens
```

### Authentication Flow
1. User clicks "Join via LinkedIn"
2. Web3Auth opens social login modal
3. User authenticates with LinkedIn
4. Web3Auth creates MPC wallet
5. User data syncs to Supabase
6. User enters onboarding flow

### Onboarding Flow
1. **Survey**: Entity name + founding idea
2. **Profile Completion**: What user is looking for
3. **Admin Review**: Manual approval process
4. **Approval Email**: Notification of acceptance
5. **Profile Access**: Full platform access

### Token Operations Flow
1. User connects wallet
2. App detects network (testnet/mainnet)
3. Fetches balances from blockchain
4. Displays real-time token information
5. Enables token transactions

### NEYXT Purchase Flow (NEW)
1. **Asset Selection**: User chooses payment method (USDC/POL/ETH/Fiat)
2. **Quote Generation**: 0x API provides swap route with pricing
3. **Price Validation**: Reference pool check against QuickSwap WETH/NEYXT
4. **Transaction Execution**: Biconomy paymaster handles gas in NEYXT
5. **Status Monitoring**: Real-time transaction status updates
6. **Auto-Swap**: Fiat purchases automatically convert to NEYXT

## 🌍 Environment Configuration

### Development Environment
- **Database**: Development Supabase project
- **Network**: Polygon Amoy Testnet
- **Web3Auth**: Sapphire Devnet
- **Tokens**: Testnet NEYXT contract
- **Buy Flow**: Testnet providers and contracts
- **Debug Tools**: Environment checker, balance debugger

### Production Environment
- **Database**: Production Supabase project
- **Network**: Polygon Mainnet
- **Web3Auth**: Sapphire Mainnet
- **Tokens**: Mainnet NEYXT contract
- **Buy Flow**: Production providers and contracts
- **Optimized**: Production builds, no debug tools

### Auto-Switching Logic
All configuration automatically switches between DEV and PROD environments based on `import.meta.env.DEV`:

```typescript
// Environment detection in config/env.ts
const config = {
  isDevelopment: import.meta.env.DEV,
  supabase: {
    url: import.meta.env.DEV 
      ? import.meta.env.VITE_SUPABASE_DEV_URL
      : import.meta.env.VITE_SUPABASE_PROD_URL,
    // ... other configs
  },
  buyFlow: {
    enableFiat: import.meta.env.VITE_FEATURE_ENABLE_FIAT === 'true',
    enableGasSponsorship: import.meta.env.VITE_FEATURE_ENABLE_GAS_SPONSORSHIP === 'true',
    // ... buy flow configs
  }
};

// Network auto-selection in config/networks.ts
const getCurrentNetwork = (): NetworkConfig => {
  const isDev = import.meta.env.DEV;
  return isDev ? POLYGON_AMOY_TESTNET : POLYGON_MAINNET;
};

// Contract addresses auto-selection in config/contracts.ts
export const CONTRACT_ADDRESSES: ContractAddresses = {
  NEYXT: import.meta.env.DEV 
    ? import.meta.env.VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS
    : import.meta.env.VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS,
  // ... all other contracts follow same pattern
};
```

**Key Auto-Switching Components:**
- **Networks**: Amoy testnet (DEV) ↔ Polygon mainnet (PROD)
- **Supabase**: Dev project (DEV) ↔ Prod project (PROD)  
- **Contracts**: Testnet addresses (DEV) ↔ Mainnet addresses (PROD)
- **Web3Auth**: Sapphire devnet (DEV) ↔ Sapphire mainnet (PROD)
- **Feature Flags**: Can be toggled per environment independently

## 🗄️ Database Schema

### Core Tables
- **`users`**: User profiles, LinkedIn data, approval status
- **`connections`**: Network connections between users
- **`admin_users`**: Admin permissions and roles
- **`app_statistics`**: Platform metrics and analytics

### Buy Flow Tables (NEW)
- **`profiler_sessions`**: Profiler interview sessions and results
- **`profiler_events`**: Individual question responses and analytics
- **`buy_flow_sessions`**: Purchase flow tracking and analytics

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

## 🔐 Security Features

### Authentication Security
- **Web3Auth MPC**: Enterprise-grade key security
- **Social Login**: Verified identity through LinkedIn
- **Session Management**: Secure token-based sessions
- **Row Level Security**: Database access controls

### Blockchain Security
- **Network Validation**: Automatic network switching
- **Contract Verification**: Smart contract existence checks
- **Transaction Signing**: Secure transaction approval
- **Balance Validation**: Real-time balance verification

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

## 🚀 Deployment Architecture

### Build Process
1. **TypeScript Compilation**: Strict type checking
2. **Vite Build**: Optimized production bundle
3. **Environment Injection**: Runtime configuration
4. **Static Generation**: Deployable to any static host

### Deployment Options
- **Vercel**: Recommended for automatic deployments
- **Netlify**: Alternative static hosting
- **AWS S3 + CloudFront**: Enterprise hosting
- **GitHub Pages**: Free hosting option

### Environment Variables
All variables automatically switch between DEV and PROD environments using the logic in `src/config/`:

```bash
# Required for all environments
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id

# Development environment (auto-selected when import.meta.env.DEV = true)
VITE_SUPABASE_DEV_URL=https://dev-project.supabase.co
VITE_SUPABASE_DEV_ANON_KEY=dev_anon_key
VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS=testnet_contract
VITE_POLYGON_TESTNET_WETH_CONTRACT_ADDRESS=testnet_weth
VITE_POLYGON_TESTNET_USDC_CONTRACT_ADDRESS=testnet_usdc
VITE_POLYGON_TESTNET_QUICKSWAP_FACTORY=testnet_factory
VITE_POLYGON_TESTNET_QUICKSWAP_ROUTER=testnet_router
VITE_POLYGON_TESTNET_REF_POOL_ADDRESS=testnet_pool
VITE_POLYGON_TESTNET_BICONOMY_PAYMASTER=testnet_paymaster
VITE_POLYGON_TESTNET_ALLOWED_ROUTERS=0x_router,quickswap_router

# Production environment (auto-selected when import.meta.env.DEV = false)
VITE_SUPABASE_PROD_URL=https://prod-project.supabase.co
VITE_SUPABASE_PROD_ANON_KEY=prod_anon_key
VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS=mainnet_contract
VITE_POLYGON_MAINNET_WETH_CONTRACT_ADDRESS=mainnet_weth
VITE_POLYGON_MAINNET_USDC_CONTRACT_ADDRESS=mainnet_usdc
VITE_POLYGON_MAINNET_QUICKSWAP_FACTORY=mainnet_factory
VITE_POLYGON_MAINNET_QUICKSWAP_ROUTER=mainnet_router
VITE_POLYGON_MAINNET_REF_POOL_ADDRESS=mainnet_pool
VITE_POLYGON_MAINNET_BICONOMY_PAYMASTER=mainnet_paymaster
VITE_POLYGON_MAINNET_ALLOWED_ROUTERS=0x_router,quickswap_router

# Buy Flow Feature Flags (can be toggled per environment)
VITE_FEATURE_ENABLE_FIAT=true
VITE_FEATURE_ENABLE_GAS_SPONSORSHIP=true
VITE_FEATURE_ENABLE_CROSS_CHAIN=false

# Server-side (Supabase secrets) - stored in Supabase dashboard
ZEROX_API_KEY=your_0x_api_key
TRANSAK_API_KEY=your_transak_api_key
BICONOMY_API_KEY=your_biconomy_api_key
BICONOMY_PAYMASTER_ID=your_paymaster_id
REF_POOL_ADDRESS=quickswap_weth_neyxt_pool
ALLOWED_ROUTERS=0x_router,quickswap_router
```

## 🧪 Development Features

### Debug Tools (Development Only)
- **Environment Checker**: Shows current environment status
- **Balance Debugger**: Inspects token balances and contracts
- **Network Indicator**: Displays current blockchain network
- **Network Mismatch Warning**: Prompts for network switching
- **Faucet Links**: Quick access to testnet token faucets

### Buy Flow Debug Tools (NEW)
- **Quote Testing**: Test 0x API integration
- **Paymaster Testing**: Test Biconomy integration
- **Onramp Testing**: Test Transak widget integration
- **Pool Price Testing**: Test QuickSwap reference pool

### Testing Capabilities
- **Email Testing**: Test welcome and approval emails
- **Balance Testing**: Test token balance fetching
- **Network Testing**: Test network switching
- **Contract Testing**: Test smart contract interactions
- **Buy Flow Testing**: Test complete purchase flow

## 📊 Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Tree Shaking**: Unused code elimination
- **Bundle Optimization**: Vite production builds

### Backend Optimizations
- **Edge Functions**: Serverless backend processing
- **Database Indexing**: Optimized query performance
- **Caching**: Supabase query caching
- **Connection Pooling**: Efficient database connections

### Buy Flow Optimizations (NEW)
- **Quote Caching**: Cache 0x quotes for 45 seconds
- **Batch Processing**: Process multiple transactions efficiently
- **Fallback Providers**: Automatic fallback to backup aggregators
- **Status Polling**: Efficient transaction status updates

## 🔮 Future Architecture Considerations

### Scalability
- **Microservices**: Potential service decomposition
- **Load Balancing**: Multiple backend instances
- **CDN Integration**: Global content delivery
- **Database Sharding**: Horizontal database scaling

### Feature Extensions
- **Real-time Chat**: WebSocket integration
- **Video Calls**: WebRTC implementation
- **File Storage**: Supabase storage integration
- **Mobile Apps**: React Native consideration

### Blockchain Enhancements
- **Multi-chain Support**: Ethereum, Solana, etc.
- **DeFi Integration**: Yield farming, staking
- **NFT Profiles**: Soulbound tokens
- **DAO Governance**: Community decision making

### Buy Flow Enhancements (NEW)
- **Cross-chain Swaps**: Multi-chain token purchases
- **Advanced Orders**: Limit orders and DCA strategies
- **Portfolio Management**: Token portfolio tracking
- **Yield Integration**: Staking and farming features

## 📚 Getting Started

### Prerequisites
- Node.js 18+
- Web3Auth account
- Supabase account
- Polygon wallet (for testing)
- 0x API key (for buy flow)
- Transak account (for fiat onramp)
- Biconomy account (for gasless transactions)



### Environment Setup
1. **Web3Auth**: Create project and get client ID
2. **Supabase**: Create dev and prod projects
3. **Polygon**: Deploy NEYXT token contracts
4. **Resend**: Set up email service for edge functions
5. **Buy Flow Providers**: Set up 0x, Transak, and Biconomy accounts

## 🤝 Contributing

### Development Guidelines
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Component Structure**: Consistent component organization
- **Testing**: Component and integration testing

### Code Standards
- **Naming**: Descriptive variable and function names
- **Documentation**: JSDoc comments for complex functions
- **Error Handling**: Comprehensive error handling
- **Performance**: Optimized rendering and data fetching

### Buy Flow Standards (NEW)
- **Provider Integration**: Consistent error handling across providers
- **Transaction Safety**: Always validate quotes before execution
- **User Experience**: Clear feedback and progress indicators
- **Analytics**: Comprehensive event tracking for optimization

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support & Resources

- **Documentation**: Comprehensive setup guides included
- **Issues**: GitHub issue tracking
- **Community**: Web3Auth and Supabase communities
- **Architecture**: Detailed technical documentation
- **Buy Flow**: Complete implementation guide in knowledge/buyFlow/

---

**WFounders** - Building the future, one founder at a time. 🚀

**Current Focus**: Implementing comprehensive NEYXT token purchase flow with gasless transactions and fiat onramp support.
