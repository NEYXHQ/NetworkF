# WFounders - Web3 Founder Network Platform

## 🏗️ Architecture Overview

**WFounders** is a modern Web3 application that creates a global network of verified company founders. Built with a **React + TypeScript + Vite** frontend, **Web3Auth** for social authentication, **Supabase** for backend services, and **Polygon blockchain** for token operations.

The platform combines traditional social networking with Web3 capabilities while keeping blockchain complexity invisible to end users.

## 🎯 Core Concept

WFounders addresses the "noise" in traditional founder networks by providing:
- **Verified founder-only access** through LinkedIn authentication
- **Web3-powered transparency** without exposing users to blockchain complexity
- **Value creation** rather than value extraction from members
- **Global founder community** with authentic connections

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
│   │   │   └── QuoteBreakdown.tsx                 # TODO [M4.4] Quote/fees/slippage summary UI
│   │   ├── user/
│   │   │   ├── AIProfilingModal.tsx
│   │   │   ├── ProfileCompletionModal.tsx
│   │   │   ├── SurveyModal.tsx
│   │   │   └── UserProfile.tsx
│   │   └── wallet/
│   │       ├── FaucetLinks.tsx
│   │       ├── NetworkMismatchWarning.tsx
│   │       ├── TokenBalance.tsx
│   │       ├── BuyNeyxtModal.tsx                  # TODO [M6.1] 3-step flow (select → quote → confirm)
│   │       ├── GaslessBadge.tsx                   # TODO [M6.3] “No gas needed – fees in NEYXT”
│   │       └── OnrampWidget.tsx                   # TODO [M7.1] Transak/Ramp widget wrapper
│   ├── config/
│   │   ├── env.ts                                 # TODO [M1.2] Add flags/API base (FIAT, GAS, CROSS_CHAIN)
│   │   ├── networks.ts                            # TODO [M1.3] Ensure Polygon mainnet + Amoy configs
│   │   └── contracts.ts                           # TODO [M1.1] Create placeholder
│   │                                              # TODO [M2.2] Fill NEYXT/WETH/router/ref-pool addresses
│   │                                              # TODO [M3.1] Reference pool policy/tags
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
│   │   ├── useBuyNeyxt.ts                         # TODO [M5.5] Orchestrate quote → execute → status
│   │   ├── useQuote.ts                            # TODO [M4.2] Call /api/quote + min-fee checks
│   │   └── useOnrampEvents.ts                     # TODO [M7.3] Listen to widget & webhook statuses
│   ├── lib/
│   │   ├── database.types.ts
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── AdminLoginPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── HomePage.tsx                           # TODO [M6.1] Add “Buy NEYXT” CTA entry point
│   ├── services/
│   │   ├── adminService.ts
│   │   ├── emailService.ts
│   │   ├── profilerLLM.ts
│   │   ├── profilerService.ts
│   │   ├── userService.ts
│   │   ├── analytics.ts                           # TODO [M6.4] Emit buy_opened/quote_returned/etc.
│   │   ├── onrampService.ts                       # TODO [M7.4] Widget params, status decorators
│   │   ├── paymasterService.ts                    # TODO [M5.4] Estimate gas_in_neyxt + UX messages
│   │   └── swapService.ts                         # TODO [M4.2] Client for /api/quote & /api/execute
│   └── types/
│       ├── auth.ts
│       ├── buy.ts                                 # TODO [M4.3] Quote/Route/Status types (zod)
│       └── rollup-plugin-polyfill-node.d.ts
├── supabase/
│   └── functions/
│       ├── _shared/
│       │   ├── cors.ts
│       │   ├── hmac.ts                            # TODO [M7.2] Verify onramp webhook (HMAC)
│       │   ├── paymaster.ts                       # TODO [M5.1] Biconomy token paymaster helpers
│       │   └── pricing.ts                         # TODO [M3.2] Pool price/TWAP + sanity checks
│       ├── openai-chat/
│       ├── send-approval-email/
│       ├── send-welcome-email/
│       ├── execute/                               # TODO [M5.2] POST /api/execute (gas in NEYXT)
│       ├── onramp-webhook/                        # TODO [M7.2] Onramp success → autoswap NEYXT
│       ├── quote/                                 # TODO [M4.1] GET /api/quote (0x on Polygon)
│       └── status/                                # TODO [M5.3] GET /api/status (poll tx/route)
├── knowledge/
│   └── FounderProfiler/
├── public/
├── Configuration files
└── README-BUY-FLOW.md                              # TODO [M1.1] Overview, flags, runbooks & milestones
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

### 5. **Admin Dashboard**
- User approval workflow (pending/approved/rejected)
- Connection management between users
- Statistics and analytics
- User status management

### 6. **Email Automation**
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

## 🌍 Environment Configuration

### Development Environment
- **Database**: Development Supabase project
- **Network**: Polygon Amoy Testnet
- **Web3Auth**: Sapphire Devnet
- **Tokens**: Testnet NEYXT contract
- **Debug Tools**: Environment checker, balance debugger

### Production Environment
- **Database**: Production Supabase project
- **Network**: Polygon Mainnet
- **Web3Auth**: Sapphire Mainnet
- **Tokens**: Mainnet NEYXT contract
- **Optimized**: Production builds, no debug tools

### Auto-Switching Logic
```typescript
// Environment detection in config/env.ts
const config = {
  isDevelopment: import.meta.env.DEV,
  supabase: {
    url: import.meta.env.DEV 
      ? import.meta.env.VITE_SUPABASE_DEV_URL
      : import.meta.env.VITE_SUPABASE_PROD_URL,
    // ... other configs
  }
};
```

## 🗄️ Database Schema

### Core Tables
- **`users`**: User profiles, LinkedIn data, approval status
- **`connections`**: Network connections between users
- **`admin_users`**: Admin permissions and roles
- **`app_statistics`**: Platform metrics and analytics

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
```bash
# Required for all environments
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id

# Development environment
VITE_SUPABASE_DEV_URL=https://dev-project.supabase.co
VITE_SUPABASE_DEV_ANON_KEY=dev_anon_key
VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS=testnet_contract

# Production environment
VITE_SUPABASE_PROD_URL=https://prod-project.supabase.co
VITE_SUPABASE_PROD_ANON_KEY=prod_anon_key
VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS=mainnet_contract
```

## 🧪 Development Features

### Debug Tools (Development Only)
- **Environment Checker**: Shows current environment status
- **Balance Debugger**: Inspects token balances and contracts
- **Network Indicator**: Displays current blockchain network
- **Network Mismatch Warning**: Prompts for network switching
- **Faucet Links**: Quick access to testnet token faucets

### Testing Capabilities
- **Email Testing**: Test welcome and approval emails
- **Balance Testing**: Test token balance fetching
- **Network Testing**: Test network switching
- **Contract Testing**: Test smart contract interactions

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

## 📚 Getting Started

### Prerequisites
- Node.js 18+
- Web3Auth account
- Supabase account
- Polygon wallet (for testing)

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd NetworkF

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Open browser
# Navigate to http://localhost:5174
```

### Environment Setup
1. **Web3Auth**: Create project and get client ID
2. **Supabase**: Create dev and prod projects
3. **Polygon**: Deploy NEYXT token contracts
4. **Resend**: Set up email service for edge functions

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

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support & Resources

- **Documentation**: Comprehensive setup guides included
- **Issues**: GitHub issue tracking
- **Community**: Web3Auth and Supabase communities
- **Architecture**: Detailed technical documentation

---

**WFounders** - Building the future, one founder at a time. 🚀
