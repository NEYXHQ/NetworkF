# Supabase Scripts

This directory contains utility scripts for managing Supabase environments and secrets.

## sync-env-secrets.sh

Automatically synchronizes environment variables from your local `.env.supabase.dev` or `.env.supabase.prd` files to the corresponding Supabase project secrets.

### Prerequisites

1. **Supabase CLI installed**:
   ```bash
   npm install -g supabase
   ```

2. **Logged in to Supabase**:
   ```bash
   supabase login
   ```

3. **Environment files present**:
   - `.env.supabase.dev` - Development secrets
   - `.env.supabase.prd` - Production secrets

### Usage

1. **Navigate to the project root**:
   ```bash
   cd /path/to/your/project
   ```

2. **Run the script**:
   ```bash
   ./supabase/scripts/sync-env-secrets.sh
   ```

3. **Follow the prompts**:
   - Select environment (dev or prod)
   - Confirm the operation
   - The script will automatically handle all deletions and creations

### What the script does

1. **Environment Selection**: Prompts you to choose dev or prod environment
2. **File Parsing**: Reads the corresponding `.env.supabase.*` file
3. **Project Linking**: Automatically links to the correct Supabase project
4. **Secret Management**:
   - Deletes existing secrets with matching names
   - Creates new secrets with values from the file
   - Auto-confirms all operations
5. **Verification**: Optionally shows the final secrets list

### Environment File Format

Your `.env.supabase.dev` and `.env.supabase.prd` files should contain environment variables in this format:

```bash
# Comments are ignored
SUPA_BICONOMY_API_KEY=your_api_key_here
SUPA_BICONOMY_PAYMASTER_ID=your_paymaster_id
SUPA_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your_key

# Empty lines are ignored

SUPA_OPENAI_API_KEY="keys with quotes are handled"
SUPA_RESEND_API_KEY='single quotes too'
```

### Features

- ✅ **Auto-detection**: Automatically detects Supabase project ID from your environment files
- ✅ **Safe operations**: Deletes old secrets before creating new ones
- ✅ **Error handling**: Comprehensive error checking and reporting
- ✅ **Progress tracking**: Real-time feedback on operations
- ✅ **Verification**: Optional verification of final state
- ✅ **Comment support**: Ignores comments and empty lines
- ✅ **Quote handling**: Properly handles quoted values

### Troubleshooting

**"Failed to link to project"**:
- Ensure you're logged in: `supabase login`
- Check your project ID in `.env.development` or `.env.production`
- Verify you have access to the project

**"Failed to set secret"**:
- Check for special characters in secret values
- Ensure the secret name is valid (alphanumeric + underscores)
- Verify your Supabase CLI has the latest version

**"Environment file not found"**:
- Create `.env.supabase.dev` or `.env.supabase.prd` in your project root
- Add your Supabase secrets to the appropriate file

### Security Notes

- ⚠️ **Never commit** `.env.supabase.*` files to version control
- ⚠️ **Backup secrets** before running the script
- ⚠️ **Verify environment** before syncing to production

### Example Output

```
🔄 Supabase Environment Secrets Sync
======================================

📋 Select environment to sync:
1) Development (dev)
2) Production (prod)

Enter your choice (1 or 2): 1
✅ Selected: dev environment

✅ Found environment file: .env.supabase.dev
📖 Parsing environment file...
  • Found: SUPA_BICONOMY_API_KEY
  • Found: SUPA_OPENAI_API_KEY
  • Found: SUPA_RESEND_API_KEY
✅ Parsed 3 environment variables

🔗 Linking to Supabase project...
ℹ️  Linking to dev project (ID: abcd1234)
✅ Project linked successfully

🔄 Syncing secrets to Supabase (dev)...

Processing: SUPA_BICONOMY_API_KEY
  ⚠️  Secret exists, updating...
  ✅ Deleted old secret
  📝 Setting new value...
  ✅ Secret set successfully

🎉 Sync completed!
========================
✅ Created/Updated: 3 secrets
🗑️  Deleted old: 3 secrets
```