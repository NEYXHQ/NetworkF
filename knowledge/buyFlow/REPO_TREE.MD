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
│   │   │   └── QuoteBreakdown.tsx                 # ☑️ [M4.4] Scaffolded - TODO: Implement quote display logic
│   │   ├── user/
│   │   │   ├── AIProfilingModal.tsx
│   │   │   ├── ProfileCompletionModal.tsx
│   │   │   ├── SurveyModal.tsx
│   │   │   └── UserProfile.tsx
│   │   └── wallet/
│   │       ├── FaucetLinks.tsx
│   │       ├── NetworkMismatchWarning.tsx
│   │       ├── TokenBalance.tsx
│   │       ├── BuyNeyxtModal.tsx                  # ☑️ [M6.1] Scaffolded - TODO: Implement 3-step buy flow
│   │       ├── GaslessBadge.tsx                   # ☑️ [M6.3] Scaffolded - TODO: Implement gas fee display
│   │       └── OnrampWidget.tsx                   # ☑️ [M7.1] Scaffolded - TODO: Integrate Transak/Ramp widget
│   ├── config/
│   │   ├── env.ts                                 # ☑️ [M1.2] Extended - TODO: Add provider API keys
│   │   ├── networks.ts                            # ☑️ [M1.3] Ready - Polygon mainnet + Amoy configured
│   │   └── contracts.ts                           # ☑️ [M1.1] Scaffolded - TODO: Fill actual contract addresses
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
│   │   ├── useBuyNeyxt.ts                         # ☑️ [M5.5] Scaffolded - TODO: Implement actual buy orchestration
│   │   ├── useQuote.ts                            # ☑️ [M4.2] Scaffolded - TODO: Implement quote API calls
│   │   └── useOnrampEvents.ts                     # ☑️ [M7.3] Scaffolded - TODO: Implement onramp event handling
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
│   │   ├── analytics.ts                           # ☑️ [M6.4] Scaffolded - TODO: Implement actual analytics events
│   │   ├── onrampService.ts                       # ☑️ [M7.4] Scaffolded - TODO: Implement onramp integration
│   │   ├── paymasterService.ts                    # ☑️ [M5.4] Scaffolded - TODO: Implement Biconomy integration
│   │   └── swapService.ts                         # ☑️ [M4.2] Scaffolded - TODO: Implement actual swap API calls
│   └── types/
│       ├── auth.ts
│       ├── buy.ts                                 # ☑️ [M4.3] Scaffolded - TODO: Add zod validation schemas
│       └── rollup-plugin-polyfill-node.d.ts
├── supabase/
│   └── functions/
│       ├── _shared/
│       │   ├── cors.ts
│       │   ├── hmac.ts                            # ☑️ [M7.2] Scaffolded - TODO: Implement actual HMAC verification
│       │   ├── paymaster.ts                       # ☑️ [M5.1] Scaffolded - TODO: Implement Biconomy helpers
│       │   └── pricing.ts                         # ☑️ [M3.2] Scaffolded - TODO: Implement pool price fetching
│       ├── openai-chat/
│       ├── send-approval-email/
│       ├── send-welcome-email/
│       ├── execute/                               # ☑️ [M5.2] Scaffolded - TODO: Implement actual swap execution
│       ├── onramp-webhook/                        # ☑️ [M7.2] Scaffolded - TODO: Implement webhook processing
│       ├── quote/                                 # ☑️ [M4.1] Scaffolded - TODO: Implement 0x quote API
│       └── status/                                # ☑️ [M5.3] Scaffolded - TODO: Implement transaction status checking
├── knowledge/
│   └── FounderProfiler/
├── public/
├── Configuration files
└── README-BUY-FLOW.md                              # TODO [M1.1] Overview, flags, runbooks & milestones
└── .env / Supabase Secrets                # REF_POOL_ADDRESS, ALLOWED_ROUTERS, policy caps (CAP_IN_WETH, CAP_PER_WALLET)