# Environment Setup Summary

## 🎯 Environment Files by Mode (Vite)

Vite loads env files by mode. Use generic key names in both files:

- `.env.development` (used by `npm run dev`)
- `.env.production` (used by `npm run build` / `npm run preview`)

## 📋 Required Environment Variables (generic)

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PROJECT_ID=
```

## 🔧 Setup Steps

1. **Create 2 Supabase projects** (dev + prod)
2. **Run `supabase-setup.sql`** in both projects
3. **Run `fix-rls-policies.sql`** in both projects
4. **Add environment variables** to `.env.development`, `.env.production`, and Vercel
5. **Test both environments**

## 🐛 Debug Features

- **Environment Checker**: Shows in bottom-right corner (dev only)
- **Console Logs**: Shows which database is connected
- **Network Indicator**: Shows current network in header

## 🚀 Deployment

Vite uses the correct env file automatically by mode. Provide appropriate values per environment in each file.

No manual configuration needed! 🎉 