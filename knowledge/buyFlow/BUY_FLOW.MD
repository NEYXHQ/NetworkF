NEYXT – Buy Flow (Polygon)

A minimal-friction way for users to buy NEYXT on Polygon using USDC/POL/ETH or Fiat, with traditional gas payments in POL (simplified V1 approach).

Principles
	•	Ship fast with existing infra: Supabase Edge Functions + Vercel
	•	Keep front & back in one repo
	•	Traditional gas UX (fees paid in POL) - simplified for V1
	•	Safe quotes (price bounds vs WETH/NEYXT reference pool)

⸻

1) High-level UX
	•	Single CTA: Buy NEYXT
	•	3 steps: Select pay asset → Get quote → Confirm
	•	Crypto path (Polygon): (USDC | ETH) → swap → NEYXT (POL for gas only, airdropped)
	•	Fiat path: Onramp → settle USDC/POL on Polygon → auto-swap → NEYXT
	•	Traditional gas: Users pay normal gas fees in POL (no paymaster complexity)
	•	Fail-fast copy if insufficient POL for gas fees

⸻

2) Current Stack
	•	Frontend: React + Vite + Tailwind (Vercel)
	•	Wallet/Auth: Web3Auth (LinkedIn-only)
	•	Backend: Supabase Edge Functions (Deno)
	•	Web3: Polygon, ethers v6
	•	Providers:
	•	Onramp: Transak (Ramp Network as backup)
	•	Swap Aggregator: 1inch/ParaSwap/OpenOcean (multi-aggregator fallback)
	•	Traditional gas: Standard ETH-style gas payments in POL

⸻

3) Repo Placement (Added/Updated files)

See the merged tree in context. Key additions:
	•	Frontend
	•	src/components/wallet/BuyNeyxtModal.tsx  (TODO [M6.1])
	•	src/components/wallet/OnrampWidget.tsx  (TODO [M7.1])
	•	src/components/wallet/GaslessBadge.tsx   (TODO [M6.3])
	•	src/components/ui/QuoteBreakdown.tsx     (TODO [M4.4])
	•	src/hooks/useQuote.ts                    (TODO [M4.2])
	•	src/hooks/useBuyNeyxt.ts                 (TODO [M5.5])
	•	src/hooks/useOnrampEvents.ts             (TODO [M7.3])
	•	src/services/swapService.ts              (TODO [M4.2])
	•	src/services/paymasterService.ts         (TODO [M5.4])
	•	src/services/onrampService.ts            (TODO [M7.4])
	•	src/services/analytics.ts                (TODO [M6.4])
	•	src/config/contracts.ts                  (TODO [M1.1/M2.2/M3.1])
	•	src/config/env.ts                        (TODO [M1.2])
	•	src/config/networks.ts                   (TODO [M1.3])
	•	src/types/buy.ts                         (TODO [M4.3])
	•	Edge Functions
	•	supabase/functions/quote/                (GET /api/quote – TODO [M4.1])
	•	supabase/functions/execute/              (POST /api/execute – TODO [M5.2])
	•	supabase/functions/status/               (GET /api/status – TODO [M5.3])
	•	supabase/functions/onramp-webhook/       (Onramp → autoswap – TODO [M7.2])
	•	supabase/functions/_shared/pricing.ts    (pool TWAP & sanity – TODO [M3.2])
	•	supabase/functions/_shared/paymaster.ts  (token paymaster utils – TODO [M5.1])
	•	supabase/functions/_shared/hmac.ts       (webhook verify – TODO [M7.2])

⸻

4) Feature Flags

Set in frontend via src/config/env.ts (public), toggled per env:
	•	NEXT_PUBLIC_FEATURE_ENABLE_FIAT (bool)
	•	NEXT_PUBLIC_FEATURE_ENABLE_GAS_SPONSORSHIP (bool)
	•	NEXT_PUBLIC_FEATURE_ENABLE_CROSS_CHAIN (bool; phase 2+)

⸻

5) Environment Variables

Public (frontend)

Safe to expose in client (build-time or runtime via Vercel env):

	•	NEXT_PUBLIC_CHAIN_ID – Polygon chain ID
	•	NEXT_PUBLIC_NEYXT_ADDRESS – NEYXT ERC-20 address on Polygon
	•	NEXT_PUBLIC_FEATURE_ENABLE_FIAT – true|false
	•	NEXT_PUBLIC_FEATURE_ENABLE_GAS_SPONSORSHIP – true|false
	•	NEXT_PUBLIC_FEATURE_ENABLE_CROSS_CHAIN – true|false

Server (Supabase Edge Functions – store as secrets)

Never expose to frontend:

	•	ZEROX_API_KEY – 0x Swap API key
	•	ONRAMP_API_KEY – Transak (or Ramp) API key
	•	ONRAMP_WEBHOOK_SECRET – HMAC secret to verify onramp events
	•	BICONOMY_API_KEY – Biconomy
	•	BICONOMY_PAYMASTER_ID – Token paymaster app/ID
	•	ALCHEMY_OR_RPC_URL_POLYGON – RPC for Polygon
	•	REF_POOL_ADDRESS – WETH/NEYXT reference pool address (DEX specific)
	•	ALLOWED_ROUTERS – Comma-separated router addresses allowlist (e.g., 0x, ParaSwap)

Optional / later:
	•	SENTRY_DSN, LOG_LEVEL, RATE_LIMIT_CFG, COMPLIANCE_GEOFENCE

⸻

6) API Contracts (Edge)

GET /api/quote  (TODO [M4.1])

Query

pay_asset=USDC|POL|ETH|FIAT
pay_chain=polygon   // v1 polygon-only; “FIAT” returns onramp params
amount_in=string_decimal
receive_asset=NEYXT
receive_chain=polygon

Response

{
  "route_id": "string",
  "amount_out_est": "string_decimal",
  "price": "string_decimal",
  "fees": {
    "protocol": "string_decimal",
    "gas_in_neyxt_est": "string_decimal"
  },
  "slippage_bps": 100,
  "estimated_time_sec": 0,
  "ttl_sec": 45,
  "warnings": ["string"]
}

POST /api/execute  (TODO [M5.2])

Body

{
  "route_id": "string",
  "user_address": "0x...",
  "sponsor_gas": true
}

Response

{
  "tx_ids": ["0x..."],
  "status_url": "/api/status?route_id=string"
}

GET /api/status  (TODO [M5.3])

Query

route_id=string

Response

{
  "state": "PENDING|CONFIRMED|FAILED",
  "tx_ids": ["0x..."],
  "details": "string"
}

POST /api/onramp-webhook  (TODO [M7.2])
	•	Verify HMAC (ONRAMP_WEBHOOK_SECRET)
	•	On success: server-initiated autoswap USDC→NEYXT via /api/execute
	•	Must be idempotent (no double swaps on retries)

⸻

7) Pricing Guardrails (Reference Pool)
	•	Reference: QuickSwap v2 WETH/NEYXT 50/50 pool on Polygon (REF_POOL_ADDRESS)
	•	Policy:
	•	slippage_bps ≤ 100
	•	max_price_impact_bps ≤ 200
	•	quote_ttl_sec = 45
	•	min_purchase_multiple_of_gas ≥ 1.25
	•	max_trade_notional_base = CAP_IN_WETH
	•	per_wallet_daily_cap_base = CAP_PER_WALLET
	•	Reject quotes if route price deviates from pool TWAP beyond policy thresholds

⸻

8) Telemetry (Events & Targets)

Events
	•	buy_opened, asset_selected, quote_returned, kyc_started
	•	swap_submitted, swap_confirmed, swap_failed
	•	time_to_complete_sec

Targets
	•	Success rate ≥ 95%
	•	Median time to complete ≤ 180s
	•	Drop-off before payment ≤ 15%

⸻

9) Milestones & Checklists

Legend:
✅ = done	🧩 = in progress	⬜ = todo

M1 – Foundation
	•	✅ M1.1 Create contracts.ts (placeholders) & README-BUY-FLOW.md
	•	✅ M1.2 Extend env.ts with feature flags & API base
	•	✅ M1.3 Ensure networks.ts has Polygon mainnet + Amoy
	•	✅ M1.4 Edge "health" routes deployable - Stubs deployed and responding ✅

Exit: ✅ Frontend builds; ✅ Edge deploy OK. M1 Complete!

⸻

M2 – Providers & Addresses
	•	✅ Transak account; Polygon USDC/POL enabled - TRANSAK_API_KEY configured in Supabase secrets
	•	✅ 0x API key; Polygon enabled - API key configured in Supabase secrets
	•	✅ Biconomy paymaster app created; NEYXT allowed as fee token - Paymaster apps configured for dev/prod
	•	✅ Fill contracts.ts: NEYXT, WETH, routers, REF_POOL_ADDRESS - All contract addresses completed in .env
	•	✅ Save secrets in Supabase (DEV/PROD) - BICONOMY_API_KEY, BICONOMY_PAYMASTER_ID, ZEROX_API_KEY, TRANSAK_API_KEY configured

M2.3 – Pool Creation
	•	✅ Choose initial NEYXT price (low, conservative) and compute seed amounts - TODO: Set price ~$0.01, calculate WETH/NEYXT amounts
	•	✅Create QuickSwap v2 WETH/NEYXT pool (50/50) - TODO: Deploy pool with seed liquidity
	•	✅ Record pool/router/factory addresses in contracts.ts and ALLOWED_ROUTERS - TODO: Update contracts.ts with actual addresses
	•	✅ Set REF_POOL_ADDRESS secret and verify quotes via 0x - TODO: Test quote endpoint with pool data

Exit: ✅ Keys present; paymaster NEYXT-configured; contract addresses completed. M2 Complete!

⸻

M3 – Reference Pool & Pricing
	•	✅ Confirm WETH/NEYXT pool DEX + address - QuickSwap v2 pool is active
	•	✅ _shared/pricing.ts: spot/TWAP fetch utility - COMPLETE: Pool data fetching implemented with enhanced features
	•	✅ Sanity checks (deviation, slippage, TTL) + unit tests - COMPLETE: Validation logic and comprehensive testing implemented
	•	✅ Pool Info Button: Added to EnvironmentChecker for real-time pool data validation

Exit: Quotes rejected when out of bounds.

Note: QuickSwap v2 infrastructure is NOT deployed on Polygon Amoy testnet, so pool data fetching will fail there (expected behavior). 
Pool data fetching works perfectly on mainnet and validates M3.2 implementation. Use "Pool Info" button in EnvironmentChecker to test.

⸻

M4 – Quote Endpoint
	•	✅ GET /api/quote with DEX Aggregator APIs (Polygon-only) - COMPLETE: Multi-aggregator implementation with intelligent fallbacks
	•	✅ swapService.ts + useQuote.ts in FE - COMPLETE: Frontend hooks connected to backend API with validation
	•	✅ QuoteBreakdown.tsx UI - COMPLETE: UI displays real quote data with warnings and price impact
	•	✅ Return gas_in_neyxt_est and warnings for min purchase - COMPLETE: Real gas estimation with NEYXT conversion
	•	⬜ Enforce min purchase (NEYXT_out ≥ 1.25× gas_in_neyxt_est) - TODO: Add validation logic
	•	⬜ Apply per-trade cap (≤ max_trade_notional_base) - TODO: Add trade size limits

M4.1 - Enhanced DEX Aggregator Integration:
	•	✅ 1inch API v6 (primary) with auth-free public endpoints - Replaces direct QuickSwap integration
	•	✅ ParaSwap API (fallback) with high price impact data extraction - Extracts quotes even from rejected trades
	•	✅ OpenOcean API (backup) for redundancy - No authentication required
	•	✅ Smart fallback chain: 1inch → ParaSwap → OpenOcean → Enhanced error reporting

M4.2 - Advanced Price Impact & Liquidity Analysis:
	•	✅ Real-time price impact calculation from API responses - Uses actual aggregator data vs manual calculations
	•	✅ Low liquidity pool detection via price distortion analysis - Detects when output USD > input USD significantly  
	•	✅ Dynamic pool TVL estimation from trade impact data - Calculates actual pool size from price behavior
	•	✅ Intelligent warnings system with confidence levels - Progressive alerts based on impact severity
	•	✅ Liquidity crisis detection for inflated token pricing - Identifies when NEYXT price is unrealistic ($4000+ vs $0.01)

M4.3 - Comprehensive Error Handling & Debugging:
	•	✅ Enhanced debug information for failed quotes - Includes pool addresses, token addresses, amounts, errors
	•	✅ API-specific error handling and logging - Different strategies for each aggregator's response format
	•	✅ Price impact override for extreme scenarios - Forces realistic impact when calculations seem too low

Implementation Notes: 
- Evolved from manual QuickSwap calculations to professional DEX aggregator integration
- Significantly reduced code complexity (800+ lines → 350 lines) while improving accuracy
- Now handles edge cases like 98.94% price impact scenarios in low liquidity pools
- Provides realistic warnings: "LIQUIDITY CRISIS: NEYXT price inflated to $4347.83 (should be ~$0.01)"
- Pool TVL estimation: "Pool has insufficient liquidity (estimated $0.52 TVL, medium confidence)"
- Better route discovery through aggregation (finds multi-hop paths like USDC→WETH→NEYXT automatically)

Next steps: Connect frontend components to the enhanced quote API, implement trade size validation.

⸻

M5 – Execute & Status (Traditional Gas in POL) - COMPLETE ✅
	•	✅ POST /api/execute with standard gas payment - COMPLETE: 1inch API v6 transaction preparation
	•	✅ GET /api/status (poll tx/route) - COMPLETE: Polygon network transaction monitoring
	•	✅ useBuyNeyxt.ts orchestration - COMPLETE: Full quote → execute → status flow
	•	✅ POL balance validation for gas fees - COMPLETE: Warnings displayed in quote breakdown
	•	✅ Web3Auth wallet integration - COMPLETE: Real transaction signing and execution
	•	✅ Transaction status polling - COMPLETE: Real-time confirmation tracking
	•	⬜ Apply per-wallet daily cap during execution - TODO: Add rate limiting per wallet

Exit: ✅ Complete purchase flow with traditional gas payments functional!

⸻

M6 – Frontend Modal UX
	•	✅ Add CTA in HomePage.tsx - COMPLETE: "Buy NEYXT" button added to wallet section
	•	✅ BuyNeyxtModal.tsx (3 steps) - COMPLETE: Functional 3-step modal connected to real API
	•	✅ Asset disable logic - COMPLETE: FIAT & POL disabled as payment options (POL reserved for gas)
	•	✅ Scrollable modal design - COMPLETE: Handles all content sizes gracefully
	•	✅ Dynamic minimum amounts - COMPLETE: ETH 0.00001, USDC 0.01, disabled assets handled
	•	⬜ GasEstimate.tsx - TODO: Show gas estimates in POL (traditional approach)
	•	⬜ analytics.ts events - TODO: Track user interactions and conversion funnel

M6.1 - Functional Buy Flow Implementation:
	•	✅ Asset selection step properly configured - Users can select USDC, ETH only (FIAT & POL disabled)
	•	✅ Quote step with amount input and real API calls - Live quote fetching with loading states
	•	✅ Real quote display with QuoteBreakdown component - Shows price impact, warnings, gas fees
	•	✅ Confirmation step with trade summary - Final review before execution (execution pending M5)
	•	✅ Progressive UI with step indicators - Visual progress tracking through the flow
	•	✅ Error handling and validation - Minimum amount validation, API error display
	•	🔄 POL balance validation - Need to check POL balance for gas fees (traditional approach)
	•	✅ Responsive design with scrollable content - Modal works on all screen sizes
	•	✅ Asset-specific minimums - ETH: 0.00001, USDC: 0.01, with proper input validation

Exit: 3-step flow functional on DEV.

M6.2 - Complete Frontend-Backend Integration (Dec 2024):
	•	✅ SwapService API Client - Real Supabase Edge Function integration with authentication
	•	✅ useQuote Hook - Comprehensive validation, error handling, POL gas warnings
	•	✅ useBuyNeyxt Hook - Full execution orchestration with Web3Auth integration
	•	✅ QuoteBreakdown UI - Live display of price impact, warnings, liquidity analysis
	•	✅ Asset Management System - Smart disable logic for problematic assets (POL, FIAT)
	•	✅ Minimum Amount Validation - Dynamic minimums: ETH (0.00001), USDC (0.01)
	•	✅ Responsive Modal Design - Scrollable content, fixed header/footer, mobile-friendly
	•	✅ Error Boundary Handling - Frontend + backend validation with clear user messaging
	•	✅ Real-time Quote Display - Shows actual DEX aggregator data with confidence indicators
	•	✅ Complete Purchase Flow - 4-step process: Select → Quote → Confirm → Execute/Status
	•	✅ Transaction Execution - Real wallet signing via Web3Auth with transaction monitoring
	•	✅ Status Polling - Live transaction confirmation tracking with block confirmations

Implementation Details:
- Frontend calls `${supabaseUrl}/functions/v1/quote|execute|status` with proper headers and auth
- Backend responds with sophisticated liquidity analysis and actual transaction data
- UI gracefully handles all execution states: preparing, executing, success, error
- Asset selection for payment options (POL disabled for payment, used only for gas)
- Progressive UX with 4 distinct steps: Select → Quote → Confirm → Execute with live status
- All validation happens on both frontend and backend for robust error handling
- Real Web3 transaction signing and blockchain interaction via Web3Auth provider

⸻

M7 – Fiat Onramp & Autoswap
	•	⬜ OnrampWidget.tsx (prefill wallet + Polygon) - TODO: Integrate Transak/Ramp widget
	•	⬜ onramp-webhook (HMAC verify, idempotent) - TODO: Add HMAC verification and webhook processing
	•	⬜ Autoswap to NEYXT via server /api/execute - TODO: Auto-trigger swap on onramp success
	•	⬜ useOnrampEvents.ts status handling - TODO: Listen to onramp events and update UI

Exit: Fiat → NEYXT path confirmed on DEV.

⸻

M8 – Observability
	•	⬜ route_id correlation across quote/execute/status - TODO: Add request tracing and correlation IDs
	•	⬜ Counters: success_rate, median_time_to_complete, drop-off - TODO: Implement metrics collection
	•	⬜ Alerts on provider errors (0x, paymaster, onramp) - TODO: Add error monitoring and alerting

Exit: Minimal dashboard covers funnel; alerts wired.

⸻

M9 – Staging/Prod & Launch
	•	⬜ Feature flags: enable internally, then public - TODO: Test with internal team, then public rollout
	•	⬜ Scripted test purchases (USDC→NEYXT, POL→NEYXT, Fiat→NEYXT) - TODO: Automated testing of all purchase paths
	•	⬜ Go-live: public flags on; support runbook ready - TODO: Enable public access and prepare support docs

Exit: Users complete purchases in ≤ 3 steps; metrics on target.

⸻

10) Runbooks (Short)

Onramp down
	•	Action: Disable NEXT_PUBLIC_FEATURE_ENABLE_FIAT; show copy recommending crypto path.

DEX liquidity thin / price impact high
	•	Action: Raise min purchase or fallback to backup aggregator; show “try smaller amount” copy.

Paymaster errors / Insufficient NEYXT for fees
	•	Action: Bump min NEYXT_out threshold; show copy “Increase amount to cover fees.”

RPC degraded
	•	Action: Switch to backup RPC; degrade to slower polling; surface status to user.

⸻

11) Security & Compliance
	•	Never custody user funds.
	•	Verify & pin contract addresses and chain IDs.
	•	Only call allowlisted routers/bridges.
	•	Use HMAC on onramp webhook; ensure idempotency.
	•	Reasonable rate limits and per-user caps.
	•	KYC/AML handled by the onramp; store status/refs only (no PII duplication).

⸻

12) Acceptance Criteria
	•	≤ 3 steps to buy
	•	No native gas needed (fees in NEYXT)
	•	Fiat & crypto both deliver NEYXT to the same wallet
	•	Clear failure when NEYXT insufficient to cover fees
	•	Metrics hit: success ≥ 95%, median time ≤ 180s

⸻

13) Decision Log (living)
	•	Backend: Supabase Edge Functions (keep single-repo DX).
	•	Onramp: Transak primary (Ramp backup).
	•	Swap: 0x primary (ParaSwap/LI.FI single-chain backup).
	•	Gas: Biconomy Token Paymaster (Gelato backup).
	•	Scope v1: Polygon-only (USDC/POL/ETH + Fiat). Cross-chain later.

⸻

Owner: Stephane
Last updated: 2024-12-19
Current Status: M5 & M6.2 ✅ Complete - Full end-to-end purchase flow operational! 
Plan Change: Simplified V1 approach - traditional gas payments in POL (no paymaster complexity)
Achievement: Users can now complete real NEYXT purchases: Quote → Execute → Confirm on Polygon
Next action: M7 (Fiat Onramp) or M8 (Observability) - depending on priority