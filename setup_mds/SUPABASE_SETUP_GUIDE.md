# Supabase Database Setup Guide

## 🎯 Overview

This guide helps you set up **two separate Supabase databases**:
- **Development Database** (localhost/development)
- **Production Database** (Vercel/production)

The app automatically switches between them based on the environment.

## 📋 Prerequisites

1. **Supabase Account** - Sign up at [supabase.com](https://supabase.com)
2. **Two Supabase Projects** - One for dev, one for prod

## 🚀 Step 1: Create Supabase Projects

### Development Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. **Project Name**: `networkf2-dev` (or your preferred name)
4. **Database Password**: Choose a strong password
5. **Region**: Choose closest to your development location
6. Click **"Create new project"**

### Production Project
1. Repeat the same steps
2. **Project Name**: `networkf2-prod` (or your preferred name)
3. **Region**: Choose closest to your production users
4. Click **"Create new project"**

## 🔧 Step 2: Get Project Credentials

### For Each Project (Dev & Prod):

1. **Go to Project Settings**
   - Click on your project in the dashboard
   - Go to **Settings** → **API**

2. **Copy the following values:**
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)
   - **Project ID** (found in the URL or settings)

## 📝 Step 3: Update Environment Variables

Create two files at repo root and use generic key names:

- `.env.development` (dev values)
- `.env.production` (prod values)

```bash
# Web3Auth
VITE_WEB3AUTH_CLIENT_ID=
VITE_APP_NAME=Wfounders

# Supabase (frontend)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PROJECT_ID=

# Contracts & DEX
VITE_POLYGON_WFOUNDER_CONTRACT_ADDRESS=
VITE_POLYGON_WETH_CONTRACT_ADDRESS=
VITE_POLYGON_USDC_CONTRACT_ADDRESS=
VITE_POLYGON_QUICKSWAP_FACTORY=
VITE_POLYGON_QUICKSWAP_ROUTER=
VITE_POLYGON_REF_POOL_ADDRESS=
VITE_POLYGON_BICONOMY_PAYMASTER=
VITE_POLYGON_ALLOWED_ROUTERS=0x...,0x...
```

### For Vercel Deployment:

Add these environment variables in your Vercel project settings (generic names):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## 🗄️ Step 4: Set Up Database Schema

### For Both Projects (Dev & Prod):

1. **Go to SQL Editor** in each project
2. **Copy and paste** the contents of `supabase-setup.sql`
3. **Click "Run"** to create the tables and policies

## 🔒 Step 5: Configure RLS Policies

### For Both Projects (Dev & Prod):

1. **Go to SQL Editor** in each project
2. **Copy and paste** the contents of `fix-rls-policies.sql`
3. **Click "Run"** to set up the policies

## 🧪 Step 6: Test the Setup

### Development Testing:
```bash
npm run dev
# App will use DEV database automatically
```

### Production Testing:
```bash
npm run build
npm run preview
# App will use PROD database automatically
```

## 🔍 Step 7: Verify Configuration

### Check Environment Detection:
1. Open browser console
2. Look for: `"Using [DEV/PROD] Supabase database"`
3. Verify the correct database URL is being used

### Test User Creation:
1. Login with Web3Auth
2. Check if user appears in the correct database
3. Verify profile data is saved

## 📊 Database Structure

### Users Table Fields:
- `id` - UUID primary key
- `email` - User's email address
- `name` - Full name
- `profile_image` - Profile picture URL
- `linkedin_id` - LinkedIn user ID
- `linkedin_url` - LinkedIn profile URL
- `headline` - Professional headline
- `location` - User location
- `industry` - Industry/field
- `summary` - Professional summary
- `positions` - Work experience (JSONB)
- `educations` - Education history (JSONB)
- `skills` - Skills list (JSONB)
- `connections_count` - LinkedIn connections
- `public_profile_url` - Public profile URL
- `email_verified` - Email verification status
- `status` - User approval status (pending/approved/rejected)
- `created_at` - Account creation date
- `updated_at` - Last update date
- `last_login_at` - Last login timestamp

## 🔧 Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Check that all environment variables are set
   - Verify the variable names match exactly

2. **"RLS policy violation"**
   - Run the `fix-rls-policies.sql` script
   - Check that policies are applied correctly

3. **"Invalid UUID" error**
   - The code now handles both UUID and email lookups
   - Should work automatically

4. **Wrong database being used**
   - Check `import.meta.env.DEV` value
   - Verify environment variables are correct

### Debug Commands:

```bash
# Test build
npm run build

# Sync secrets to Supabase
npm run secrets:dev
npm run secrets:prod
```

## 🚀 Deployment Checklist

### Before Deploying to Production:

- [ ] Production Supabase project created
- [ ] Production database schema set up
- [ ] Production RLS policies configured
- [ ] Vercel environment variables set
- [ ] Test production database connection
- [ ] Verify user data flows correctly

## 📈 Monitoring

### Supabase Dashboard:
- Monitor user registrations
- Check database performance
- Review error logs
- Track user engagement

### Vercel Analytics:
- Monitor app performance
- Track user sessions
- Check for errors

## 🔄 Environment Selection (Vite)

Vite selects `.env.development` for dev and `.env.production` for build/preview. Provide environment-specific values in each file.