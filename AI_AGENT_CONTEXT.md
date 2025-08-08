## Purpose

This document gives an AI agent the minimal but complete context needed to understand and work within this application. It covers architecture, data flow, key modules, workflows, and strict contribution rules (style, safety, and quality) to follow when proposing or making changes.

## What This App Is

WFounders is a static React + TypeScript web app (Vite) for a network of entrepreneurs. Users log in with Web3Auth using LinkedIn, automatically get a wallet, and are onboarded via a short survey and profile completion flow. Admins approve users and view stats. Supabase provides the database and Edge Functions for emails (welcome and approval). The site is deployed on Vercel.

## High-Level Architecture

- **Frontend**: React 19 + TypeScript, Tailwind CSS 4.1, Vite
- **Auth & Wallet**: Web3Auth Plug-and-Play, MPC-based wallet via social login (LinkedIn)
- **Blockchain**: Ethers v6, Polygon (Amoy testnet in dev, Mainnet in prod), NEYXT token support
- **Backend/Data**: Supabase (Postgres, RLS, Realtime) with typed client, Edge Functions for emails
- **Deployment**: Static site on Vercel; serverless emails via Supabase Edge Functions
- **Environments**: Auto-switching Dev/Prod by `import.meta.env.DEV` with corresponding network and Supabase credentials

## Key Workflows

- **Authentication**: Web3Auth modal (LinkedIn focus) → session + wallet provider
- **Onboarding**:
  - Survey (entity name + founding idea) → `users.entity_name`, `users.founding_idea`, `users.survey_completed`
  - Profile Completion (what the founder is looking for) → `users.looking_for`, `users.profile_completed`
  - Users can skip and complete later
- **Approval**: Users default to `status = 'pending'`; admins approve/reject. Approval email sent on approval.
- **Emails**: Supabase Edge Functions `send-welcome-email` and `send-approval-email` (Resend), triggered via `emailService` and also testable from the dev debug panel
- **Web3**: Read native and NEYXT balances, send tokens, ensure approvals, handle network mismatch & switching

## Notable Files and Their Roles

- `src/config/env.ts`: Central config. Exposes environment, network, Web3Auth, Supabase values. Source of truth for `config` used across app
- `src/config/networks.ts`: Full network definitions (chain IDs, RPCs, explorers, contracts, features). Selects the active network based on environment
- `src/contexts/Web3AuthProvider.tsx`: Initializes Web3Auth, holds connection state, exposes wallet operations (balances, send, approvals), and auto network switching
- `src/hooks/ethersRPC.ts`: Low-level blockchain helpers (get accounts, chain, balances, send, token approval)
- `src/hooks/useTokenService.ts`: Safe wrapper around token operations with validation and formatting
- `src/hooks/useSupabaseUser.ts`: User load/refresh; survey/profile completion; maps Web3Auth user → LinkedIn-shaped profile data
- `src/services/userService.ts`: CRUD for `users` table, onboarding updates, status changes, stats queries
- `src/services/adminService.ts`: Admin queries for users, connections, and statistics; status updates; admin toggles
- `src/services/emailService.ts`: Client calls to Edge Functions for welcome/approval emails (Resend-backed)
- `src/components/user/SurveyModal.tsx`: Step 1 onboarding (entity name, founding idea)
- `src/components/user/ProfileCompletionModal.tsx`: Step 2 onboarding (what the founder is looking for)
- `src/components/debug/EnvironmentChecker.tsx`: Dev-only debug panel; email test buttons; shows env/network/db
- `src/components/ui/NetworkIndicator.tsx`: Dev-only network chip
- `src/components/wallet/NetworkMismatchWarning.tsx`: Detects and prompts to switch to the configured chain
- `src/components/debug/BalanceDebugger.tsx`: Dev tool to inspect balances and contract code
- `src/pages/AdminPage.tsx`, `src/pages/AdminLoginPage.tsx`: Admin dashboard and login
- `src/pages/HomePage.tsx`: Home, ties in onboarding flows and wallet UI
- `src/lib/database.types.ts`: Typed Supabase schema (users, connections, admin_users, app_statistics)
- `supabase/functions/send-welcome-email/index.ts`: Edge Function to send welcome email
- `supabase/functions/send-approval-email/index.ts`: Edge Function to send approval email

## Data Model (Essentials)

- `users`
  - Identity & LinkedIn-like fields: `email`, `name`, `profile_image`, `linkedin_id`, ...
  - Status & admin: `status` ('pending' | 'approved' | 'rejected'), `is_admin`
  - Onboarding: `entity_name`, `founding_idea`, `survey_completed`, `looking_for`, `profile_completed`
  - Activity: `last_login_at`, connection counters
- `connections`: Initiator/recipient, status (pending/accepted/rejected/cancelled)
- `admin_users`: Admin metadata/permissions
- `app_statistics`: Aggregated app stats store

See `src/lib/database.types.ts` for exact typings. The app relies on RLS; all operations must respect it.

## Environment & Configuration

- `.env` required keys (dev):
  - `VITE_WEB3AUTH_CLIENT_ID`
  - `VITE_APP_NAME`
  - `VITE_SUPABASE_DEV_URL`, `VITE_SUPABASE_DEV_ANON_KEY`, `VITE_SUPABASE_DEV_PROJECT_ID`
  - `VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS`
- Production equivalents for Supabase and NEYXT (mainnet)
- Auto detection: `import.meta.env.DEV` drives network + Supabase selection

## Email Delivery

- Edge Functions deployed on Supabase:
  - `send-welcome-email`
  - `send-approval-email`
- Use `RESEND_API_KEY` secret in Supabase
- Development testing: buttons in `EnvironmentChecker` (dev-only)

## Routes

- `/`: Home + onboarding flow + wallet
- `/admin/login`: Admin login
- `/admin`: Admin dashboard (approvals, stats)

## Coding & Collaboration Rules (STRICT)

- **Language & Types**: TypeScript only. Provide proper type annotations. Do not use `any` unless explicitly permitted.
- **Styling**: Tailwind CSS utility-first. Follow existing patterns (colors: Princeton orange, teal blue, slate gray, etc.). Responsive, mobile-friendly UI. Use minimal, readable `lucide-react` icons.
- **Safety**: Do not modify current logic unless necessary. Prefer additive/minimal, safe changes.
- **Quality**: Respect ESLint and Prettier. No new linter errors. Match existing formatting.
- **Control Flow**: Use early returns, handle edge cases first, keep nesting shallow, descriptive names.
- **Comments**: Brief comments only for non-obvious logic; explain why, not how.
- **Build Green**: After edits, ensure lint/build passes. For significant changes, describe verification steps.

## How To Extend Features (Guidance for AI)

1. Locate where the change belongs using filenames above (config, hooks, services, components).
2. Keep business logic in `services/` or hooks; keep UI in `components/`.
3. Read from `config/env.ts` and `config/networks.ts` rather than hardcoding.
4. For blockchain features: prefer `useTokenService` or `ethersRPC` helpers; respect network config.
5. For database changes: ensure fields exist in Supabase; update `src/lib/database.types.ts` if schema evolves (and corresponding guides/SQL).
6. For emails: call through `emailService`; do not expose secrets client-side.
7. For admin features: use `adminService` and `useAdmin` to gate UI/actions.
8. Add types, validate inputs, and handle errors gracefully.

## Debugging Aids (Dev Only)

- Toggle the **Environment Checker** via the header user menu (dev mode). It shows: env, network, Supabase project, faucet links, balances, and test email buttons.
- **NetworkIndicator** pill and **NetworkMismatchWarning** help ensure the correct chain is selected.

## Build, Run, Lint

```bash
npm run dev      # local dev (auto uses dev env + testnet)
npm run build    # production build
npm run preview  # preview static build
npm run lint     # ESLint
```

## Common Pitfalls

- Using the wrong network/contract address; always consult `config/networks.ts` and `.env`.
- Exposing secrets in client code (never do this). Use Supabase secrets for Edge Functions.
- Skipping typing or using `any`; this causes downstream breakage.
- Bypassing `useTokenService` and re-implementing token logic ad-hoc.

## Team Preferences & Context

- Local dev uses testnet; production uses mainnet. The app is deployed on Vercel. Supabase hosts the database and Edge Functions.
- UI should be responsive with readable, modest icon usage (`lucide-react`).

## When In Doubt

- Prefer reading existing hooks/services before adding new ones.
- Keep changes minimal and reversible. Do not refactor broadly unless required to fix a bug.
- Ensure new features are behind existing configuration patterns and do not break Dev/Prod switching.


