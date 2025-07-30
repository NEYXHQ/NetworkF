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

### Create/Update `.env` file:

```bash
# Web3Auth Configuration
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here

# App Configuration
VITE_APP_NAME=NetworkF2

# Development Supabase (localhost)
VITE_SUPABASE_DEV_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_DEV_ANON_KEY=your_dev_anon_key_here
VITE_SUPABASE_DEV_PROJECT_ID=your_dev_project_id_here

# Production Supabase (Vercel)
VITE_SUPABASE_PROD_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_PROD_ANON_KEY=your_prod_anon_key_here
VITE_SUPABASE_PROD_PROJECT_ID=your_prod_project_id_here

# NEYXT Token Contract Addresses
VITE_POLYGON_TESTNET_NEYXT_CONTRACT_ADDRESS=your_polygon_amoy_testnet_contract_address_here
VITE_POLYGON_MAINNET_NEYXT_CONTRACT_ADDRESS=your_polygon_mainnet_contract_address_here
```

### For Vercel Deployment:

Add these environment variables in your Vercel project settings:
- `VITE_SUPABASE_PROD_URL`
- `VITE_SUPABASE_PROD_ANON_KEY`
- `VITE_SUPABASE_PROD_PROJECT_ID`

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
# Check environment variables
echo $VITE_SUPABASE_DEV_URL
echo $VITE_SUPABASE_PROD_URL

# Test build
npm run build

# Check which database is being used
# Look in browser console for database URL
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

## 🔄 Environment Switching Logic

The app automatically detects the environment:

```typescript
// Development (localhost)
if (import.meta.env.DEV) {
  // Uses VITE_SUPABASE_DEV_* variables
  // Connects to development database
}

// Production (Vercel)
else {
  // Uses VITE_SUPABASE_PROD_* variables
  // Connects to production database
}
```

This ensures:
- **Development**: Uses dev database, testnet network
- **Production**: Uses prod database, mainnet network
- **Automatic switching**: No manual configuration needed 