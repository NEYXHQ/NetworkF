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
│   │                                              # TODO [M2.2] Fill NEYXT/WETH/token router addresses
│   │                                              # TODO [M2.3] Record QuickSwap v2 WETH/NEYXT 50/50 pool address (REF_POOL_ADDRESS) + QuickSwap router/factory
│   │                                              # TODO [M3.1] Tag reference DEX = QuickSwap v2; policy bounds for sanity checks
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
│       │   └── pricing.ts                         # TODO [M3.2] QuickSwap v2 reserve math + TWAP; apply sanity bounds vs REF_POOL_ADDRESS
│       ├── openai-chat/
│       ├── send-approval-email/
│       ├── send-welcome-email/
│       ├── execute/                               # TODO [M5.2] POST /api/execute (gas in NEYXT) — enforce per_wallet_daily_cap_base
│       ├── onramp-webhook/                        # TODO [M7.2] Onramp success → autoswap NEYXT
│       ├── quote/                                 # TODO [M4.1] GET /api/quote (0x on Polygon) — enforce min_purchase_multiple_of_gas, max_trade_notional_base
│       └── status/                                # TODO [M5.3] GET /api/status (poll tx/route)
├── knowledge/
│   └── FounderProfiler/
├── public/
├── Configuration files
└── README-BUY-FLOW.md                              # TODO [M1.1] Overview, flags, runbooks & milestones
└── .env / Supabase Secrets                # REF_POOL_ADDRESS, ALLOWED_ROUTERS, policy caps (CAP_IN_WETH, CAP_PER_WALLET)