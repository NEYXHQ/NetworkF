# BUY FLOW PROGRESS SUMMARY

# Legend
✅ = done
🧩 = in progress
⬜ = todo

## Milestone Status (as of 2024-12-19)
- ✅ **M1 - Foundation**: Complete - All config files ready, Edge functions deployed
- ✅ **M2 - Providers & Addresses**: Complete - 0x, Biconomy, Transak, contract addresses configured
- 🧩 **M3 - Reference Pool & Pricing**: In Progress - Ready to implement pricing logic
- 🧩 **M7 - Fiat Onramp**: Enhanced - Transak webhook integration started
- ⬜ **M4-M6, M8-M9**: Pending - Quote endpoint, execution, frontend modal, observability

---

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
│   │   │   └── QuoteBreakdown.tsx                 # 🧩 [M4.4] Scaffolded - TODO: Implement quote display logic
│   │   ├── user/
│   │   │   ├── AIProfilingModal.tsx
│   │   │   ├── ProfileCompletionModal.tsx
│   │   │   ├── SurveyModal.tsx
│   │   │   └── UserProfile.tsx
│   │   └── wallet/
│   │       ├── FaucetLinks.tsx
│   │       ├── NetworkMismatchWarning.tsx
│   │       ├── TokenBalance.tsx
│   │       ├── BuyWfounderModal.tsx                  # 🧩 [M6.1] Scaffolded - TODO: Implement 3-step buy flow
│   │       ├── GaslessBadge.tsx                   # 🧩 [M6.3] Scaffolded - TODO: Implement gas fee display
│   │       └── OnrampWidget.tsx                   # 🧩 [M7.1] Scaffolded - TODO: Integrate Transak/Ramp widget
│   ├── config/
│   │   ├── env.ts                                 # ✅ [M1.2] Complete - All provider API keys configured (0x ✅, Biconomy ✅, Transak ✅)
│   │   ├── networks.ts                            # ✅ [M1.3] Complete - Polygon mainnet + Amoy configured
│   │   └── contracts.ts                           # ✅ [M1.1] Complete - All contract addresses configured in .env
│   │                                              # ✅ [M2.2] Complete - WFOUNDER/WETH/router addresses configured
│   │                                              # ✅ [M2.3] Complete - QuickSwap v2 WETH/WFOUNDER 50/50 pool address (REF_POOL_ADDRESS) + QuickSwap router/factory configured
│   │                                              # ✅ [M3.1] Complete - Reference DEX = QuickSwap v2; policy bounds configured
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
│   │   ├── useBuyWfounder.ts                         # 🧩 [M5.5] Scaffolded - TODO: Implement actual buy orchestration
│   │   ├── useQuote.ts                            # 🧩 [M4.2] Scaffolded - TODO: Implement quote API calls
│   │   └── useOnrampEvents.ts                     # 🧩 [M7.3] Scaffolded - TODO: Implement onramp event handling
│   ├── lib/
│   │   ├── database.types.ts
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── AdminLoginPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── HomePage.tsx                           # TODO [M6.1] Add "Buy WFOUNDER" CTA entry point
│   ├── services/
│   │   ├── adminService.ts
│   │   ├── emailService.ts
│   │   ├── profilerLLM.ts
│   │   ├── profilerService.ts
│   │   ├── userService.ts
│   │   ├── analytics.ts                           # 🧩 [M6.4] Scaffolded - TODO: Implement actual analytics events
│   │   ├── onrampService.ts                       # 🧩 [M7.4] Scaffolded - TODO: Implement onramp integration
│   │   ├── paymasterService.ts                    # 🧩 [M5.4] Scaffolded - TODO: Implement Biconomy integration
│   │   └── swapService.ts                         # 🧩 [M4.2] Scaffolded - TODO: Implement actual swap API calls
│   └── types/
│       ├── auth.ts
│       ├── buy.ts                                 # 🧩 [M4.3] Scaffolded - TODO: Add zod validation schemas
│       └── rollup-plugin-polyfill-node.d.ts
├── supabase/
│   └── functions/
│       ├── _shared/
│       │   ├── cors.ts
│       │   ├── hmac.ts                            # 🧩 [M7.2] Scaffolded - TODO: Implement actual HMAC verification
│       │   ├── paymaster.ts                       # 🧩 [M5.1] Scaffolded - TODO: Implement Biconomy helpers
│       │   └── pricing.ts                         # 🧩 [M3.2] Scaffolded - TODO: Implement pool price fetching
│       ├── openai-chat/
│       ├── send-approval-email/
│       ├── send-welcome-email/
│       ├── execute/                               # 🧩 [M5.2] Scaffolded - TODO: Implement actual swap execution
│       ├── onramp-webhook/                        # 🧩 [M7.2] Enhanced - TRANSAK_API_KEY integrated, webhook parsing added
│       ├── quote/                                 # 🧩 [M4.1] Scaffolded - TODO: Implement 0x quote API
│       └── status/                                # 🧩 [M5.3] Scaffolded - TODO: Implement transaction status checking
├── knowledge/
│   └── FounderProfiler/
├── public/
├── Configuration files
└── README-BUY-FLOW.md                              # TODO [M1.1] Overview, flags, runbooks & milestones
└── .env / Supabase Secrets                # REF_POOL_ADDRESS, ALLOWED_ROUTERS, policy caps (CAP_IN_WETH, CAP_PER_WALLET)