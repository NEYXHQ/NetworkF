# 🎯 WFOUNDER Token Airdrop Setup Guide

This guide outlines the steps you need to complete to activate the automated token airdrop system for profiler completion rewards.

## 📋 Prerequisites Checklist

### ✅ **Your Required Actions:**

#### 1. **Treasury Wallet Setup**
- [ ] Create a dedicated wallet for airdrop distributions
- [ ] Fund the wallet with sufficient WFOUNDER tokens (recommend 10,000+ for initial testing)
- [ ] Record the wallet's private key and address securely

#### 2. **Environment Variables (Frontend)**
✅ **Already Set** - You've configured these in your `.env.development`:

```bash
# Airdrop Configuration - Your Variable Names
VITE_WFOUNDER_AIRDROP_AMOUNT_FOR_SURVEY_COMPLETION=10
VITE_POLYGON_TREASURY_WALLET_ADDRESS=0x_YOUR_TREASURY_WALLET_ADDRESS_HERE
VITE_POLYGON_TREASURY_WALLET_PRIVATE_KEY=0x_your_private_key_here
VITE_FEATURE_ENABLE_AIRDROP=true

# Contract Addresses (if not already set)
VITE_POLYGON_WFOUNDER_CONTRACT_ADDRESS=0x_YOUR_WFOUNDER_CONTRACT_ADDRESS
```

#### 3. **Supabase Secret Auto-Sync**
✅ **Automatic** - Your variables will auto-sync to Supabase secrets:

- `VITE_POLYGON_TREASURY_WALLET_PRIVATE_KEY` → Available in Edge Functions
- `VITE_POLYGON_WFOUNDER_CONTRACT_ADDRESS` → Available in Edge Functions
- Standard Polygon RPC will be used (https://polygon-rpc.com)

#### 4. **Database Migration**
Run the database migration to create the airdrop_claims table:
```bash
# Navigate to your Supabase project and run:
/supabase/migrations/20250109_airdrop_claims.sql
```

#### 5. **Deploy Edge Function**
Deploy the airdrop Edge Function to Supabase:
```bash
supabase functions deploy airdrop-tokens
```

## 🔧 **Implementation Status**

### ✅ **Completed Components:**

#### Database Layer
- [x] `airdrop_claims` table with RLS policies
- [x] Unique constraints preventing duplicate claims
- [x] Security indexes for rate limiting
- [x] Audit trail and error logging

#### Backend Services
- [x] Supabase Edge Function for token distribution
- [x] Treasury wallet integration with ethers.js
- [x] Transaction verification and retry logic
- [x] Comprehensive error handling and logging

#### Frontend Integration
- [x] `useAirdropService` hook for claim management
- [x] Enhanced profiler completion flow
- [x] Real-time airdrop status display
- [x] Error handling and user feedback

#### Security Measures
- [x] One airdrop per user enforcement
- [x] Wallet address validation
- [x] Profile completion verification
- [x] Rate limiting configuration
- [x] Treasury balance monitoring

## 🎮 **User Experience Flow**

### When Users Complete the Profiler:

1. **Profile Generation** → Assessment completed, personalized profile created
2. **Automatic Trigger** → System detects completion and initiates airdrop
3. **Processing Display** → User sees spinner: "Processing Your Welcome Gift..."
4. **Blockchain Transaction** → Treasury wallet sends WFOUNDER tokens to user's wallet
5. **Success Confirmation** → "🎉 Welcome Gift Delivered!" with transaction hash
6. **Balance Update** → Tokens appear in user's wallet

### Error Scenarios:
- **Network Issues** → Retry logic attempts transaction again
- **Low Treasury** → Alert sent to admin, user informed to contact support
- **Invalid Wallet** → User shown helpful error message
- **Already Claimed** → User shown existing claim status

## 🛡️ **Security Features**

### Fraud Prevention:
- **One Per User**: Database constraint prevents duplicate claims
- **Wallet Validation**: Checks for valid Ethereum addresses
- **Profile Verification**: Requires completed assessment
- **Transaction Verification**: Confirms on-chain success

### Rate Limiting:
- **System-wide Limits**: 100 claims/hour, 1000 claims/day
- **User Cooldowns**: 5 minutes between attempts
- **Treasury Protection**: Maximum 100 WFOUNDER per claim

### Monitoring:
- **Real-time Alerts**: Low treasury balance warnings
- **Audit Logs**: Complete transaction history
- **Error Tracking**: Failed claim investigation tools

## 🧪 **Testing Checklist**

### Before Production Deployment:

#### Testnet Testing:
- [ ] Deploy to Polygon Amoy testnet first
- [ ] Test with small token amounts (1-5 WFOUNDER)
- [ ] Verify all user flows work correctly
- [ ] Test error scenarios (insufficient balance, etc.)

#### Security Validation:
- [ ] Confirm duplicate claim prevention
- [ ] Test rate limiting functionality
- [ ] Verify treasury balance alerts
- [ ] Check RLS policies are enforced

#### User Experience:
- [ ] Complete full profiler → airdrop flow
- [ ] Verify status messages display correctly
- [ ] Confirm tokens arrive in test wallets
- [ ] Test "take assessment again" functionality

## ⚙️ **Configuration Options**

### Adjustable Settings:

```typescript
// In src/config/airdrop.ts - modify these as needed:
export const AIRDROP_SECURITY_CONFIG = {
  maxClaimsPerHour: 100,        // System capacity
  maxClaimsPerDay: 1000,        // Daily limit
  cooldownPeriodMinutes: 5,     // User retry delay
  minProfileConfidence: 0.7,    // Quality gate
  maxSingleAirdropAmount: '100' // Safety limit
};
```

### Environment Toggles:
```bash
# Disable airdrops temporarily
VITE_FEATURE_ENABLE_AIRDROP=false

# Adjust token amount (using your variable name)
VITE_WFOUNDER_AIRDROP_AMOUNT_FOR_SURVEY_COMPLETION=25
```

## 🚨 **Production Readiness**

### Before Going Live:
1. **Treasury Funding**: Ensure 30-day supply of tokens minimum
2. **Monitoring Setup**: Configure Supabase alerts and logging
3. **Support Process**: Prepare team for airdrop-related user questions
4. **Emergency Stops**: Have plan to disable airdrops if needed

### Launch Strategy:
1. **Soft Launch**: Enable for small user group first
2. **Monitor Metrics**: Watch success rates and error patterns
3. **Scale Up**: Gradually increase to full user base
4. **Iterate**: Adjust based on real-world usage patterns

## 📞 **Support & Troubleshooting**

### Common Issues:
- **"Gift Processing Issue"** → Check treasury balance and RPC connectivity
- **Duplicate Claims** → Verify user hasn't already received tokens
- **Transaction Pending** → Normal for blockchain congestion, tokens will arrive

### Admin Tools:
- View all claims: Query `airdrop_claims` table
- Check treasury balance: Use treasury wallet address on Polygonscan
- Failed transactions: Filter `airdrop_claims` where `status = 'failed'`

---

## 🎉 **Ready to Launch!**

Once you complete the setup checklist above, the airdrop system will be fully operational. Users completing the profiler will automatically receive their welcome gift of WFOUNDER tokens, creating a delightful onboarding experience that introduces them to your Web3 community platform.

**Questions?** The implementation is designed to be secure, scalable, and user-friendly. All error scenarios are handled gracefully, and the system provides comprehensive logging for troubleshooting.