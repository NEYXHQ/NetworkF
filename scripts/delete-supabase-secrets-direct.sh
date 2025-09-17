#!/bin/bash

# Direct deletion of known Supabase secrets
# Usage: ./scripts/delete-supabase-secrets-direct.sh [environment]

# Environment selection
if [ -n "$1" ]; then
  ENV="$1"
else
  echo "🌍 Select environment to clean up:"
  echo "1. Development (kxepoivhqnurxmkgiojo)"
  echo "2. Production (mnmlmectnlcrbnlhxyrp)"
  echo ""
  read -p "Enter choice (1 or 2): " choice

  case $choice in
    1) ENV="development" ;;
    2) ENV="production" ;;
    *) echo "❌ Invalid choice. Exiting."; exit 1 ;;
  esac
fi

# Set project ref based on environment
case $ENV in
  "development"|"dev"|"1")
    PROJECT_REF="kxepoivhqnurxmkgiojo"
    ENV_NAME="Development"
    ;;
  "production"|"prod"|"2")
    PROJECT_REF="mnmlmectnlcrbnlhxyrp"
    ENV_NAME="Production"
    ;;
  *)
    # Assume it's a direct project ref
    PROJECT_REF="$ENV"
    ENV_NAME="Custom ($ENV)"
    ;;
esac

echo "🧹 Deleting all non-reserved Supabase secrets"
echo "🌍 Environment: $ENV_NAME"
echo "📋 Project ID: $PROJECT_REF"
echo ""

# List of all known secrets to delete (from your current list)
SECRETS_TO_DELETE=(
  "ENVIRONMENT"
  "NETWORK_ENVIRONMENT"
  "OPENAI_API_KEY"
  "VITE_APP_NAME"
  "VITE_BUY_FLOW_API_BASE_URL"
  "VITE_FEATURE_ENABLE_CROSS_CHAIN"
  "VITE_FEATURE_ENABLE_FIAT"
  "VITE_FEATURE_ENABLE_GAS_SPONSORSHIP"
  "VITE_WFOUNDER_AIRDROP_AMOUNT_FOR_SURVEY_COMPLETION"
  "VITE_POLYGON_ALLOWED_ROUTERS"
  "VITE_POLYGON_BICONOMY_PAYMASTER"
  "VITE_POLYGON_WFOUNDER_CONTRACT_ADDRESS"
  "VITE_POLYGON_QUICKSWAP_FACTORY"
  "VITE_POLYGON_QUICKSWAP_ROUTER"
  "VITE_POLYGON_REF_POOL_ADDRESS"
  "VITE_POLYGON_TREASURY_WALLET_ADDRESS"
  "VITE_POLYGON_TREASURY_WALLET_PRIVATE_KEY"
  "VITE_POLYGON_USDC_CONTRACT_ADDRESS"
  "VITE_POLYGON_WETH_CONTRACT_ADDRESS"
  "VITE_SUPABASE_ANON_KEY"
  "VITE_SUPABASE_PROJECT_ID"
  "VITE_SUPABASE_URL"
  "VITE_WEB3AUTH_CLIENT_ID"
  "ZEROX_API_KEY"
)

echo "🗑️  Will attempt to delete ${#SECRETS_TO_DELETE[@]} secrets:"
for secret in "${SECRETS_TO_DELETE[@]}"; do
  echo "   - $secret"
done
echo ""

read -p "❓ Continue with deletion? (y/N): " confirm
case $confirm in
  [yY]|[yY][eE][sS]) ;;
  *) echo "❌ Cancelled"; exit 0 ;;
esac

echo ""
echo "🚀 Starting deletion..."

deleted=0
not_found=0

for secret in "${SECRETS_TO_DELETE[@]}"; do
  echo -n "Deleting $secret... "

  # Try to delete the secret (--yes flag skips confirmation)
  if supabase secrets unset --project-ref $PROJECT_REF --yes "$secret" 2>/dev/null; then
    echo "✅ Deleted"
    ((deleted++))
  else
    echo "⚠️  Not found (may already be deleted)"
    ((not_found++))
  fi
done

echo ""
echo "🎉 Deletion complete!"
echo "✅ Successfully deleted: $deleted secrets"
echo "⚠️  Not found: $not_found secrets"
echo ""

echo "📋 Final check - listing remaining secrets:"
supabase secrets list --project-ref $PROJECT_REF

echo ""
echo "✅ Done! Only reserved secrets should remain:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - SUPABASE_DB_URL"