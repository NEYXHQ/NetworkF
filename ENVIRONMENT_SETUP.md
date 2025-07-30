# Environment Setup Summary

## 🎯 Automatic Environment Switching

The app now automatically switches between **development** and **production** environments:

### Development (localhost)
- **Database**: Uses `VITE_SUPABASE_DEV_*` variables
- **Network**: Polygon Amoy Testnet
- **Web3Auth**: Sapphire Devnet

### Production (Vercel)
- **Database**: Uses `VITE_SUPABASE_PROD_*` variables  
- **Network**: Polygon Mainnet
- **Web3Auth**: Sapphire Mainnet

## 📋 Required Environment Variables

### Development (.env file):
```bash
VITE_SUPABASE_DEV_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_DEV_ANON_KEY=your_dev_anon_key_here
VITE_SUPABASE_DEV_PROJECT_ID=your_dev_project_id_here
```

### Production (Vercel):
```bash
VITE_SUPABASE_PROD_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_PROD_ANON_KEY=your_prod_anon_key_here
VITE_SUPABASE_PROD_PROJECT_ID=your_prod_project_id_here
```

## 🔧 Setup Steps

1. **Create 2 Supabase projects** (dev + prod)
2. **Run `supabase-setup.sql`** in both projects
3. **Run `fix-rls-policies.sql`** in both projects
4. **Add environment variables** to `.env` and Vercel
5. **Test both environments**

## 🐛 Debug Features

- **Environment Checker**: Shows in bottom-right corner (dev only)
- **Console Logs**: Shows which database is connected
- **Network Indicator**: Shows current network in header

## 🚀 Deployment

The app will automatically:
- Use **dev database** when running `npm run dev`
- Use **prod database** when deployed to Vercel
- Switch **networks** accordingly
- Handle **Web3Auth environments** automatically

No manual configuration needed! 🎉 