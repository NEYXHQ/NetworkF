#!/bin/bash

# Quick cleanup - deletes all non-reserved Supabase secrets
# Usage: ./scripts/quick-clean-supabase.sh [project-ref]

PROJECT_REF=${1:-"mnmlmectnlcrbnlhxyrp"}

echo "🧹 Quick cleaning Supabase secrets for project: $PROJECT_REF"

# List of variables to delete (all current non-reserved ones)
VARS_TO_DELETE=(
  "ENVIRONMENT"
  "NETWORK_ENVIRONMENT"
  "OPENAI_API_KEY"
  "VITE_APP_NAME"
  "VITE_BUY_FLOW_API_BASE_URL"
  "VITE_FEATURE_ENABLE_CROSS_CHAIN"
  "VITE_FEATURE_ENABLE_FIAT"
  "VITE_FEATURE_ENABLE_GAS_SPONSORSHIP"
  "VITE_WFOUNDER_AIRDROP_AMOUNT_FOR_SURVEY_COMPLETION"
  "VITE_ETHEREUM_ALLOWED_ROUTERS"
  "VITE_ETHEREUM_BICONOMY_PAYMASTER"
  "VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS"
  "VITE_ETHEREUM_UNISWAP_FACTORY"
  "VITE_ETHEREUM_UNISWAP_ROUTER"
  "VITE_ETHEREUM_REF_POOL_ADDRESS"
  "VITE_ETHEREUM_TREASURY_WALLET_ADDRESS"
  "VITE_ETHEREUM_TREASURY_WALLET_PRIVATE_KEY"
  "VITE_ETHEREUM_USDC_CONTRACT_ADDRESS"
  "VITE_ETHEREUM_WETH_CONTRACT_ADDRESS"
  "VITE_SUPABASE_ANON_KEY"
  "VITE_SUPABASE_PROJECT_ID"
  "VITE_SUPABASE_URL"
  "VITE_WEB3AUTH_CLIENT_ID"
)

echo "🗑️  Will delete ${#VARS_TO_DELETE[@]} secrets..."

for var in "${VARS_TO_DELETE[@]}"; do
  echo "Deleting: $var"
  supabase secrets unset --project-ref $PROJECT_REF --yes "$var" 2>/dev/null || echo "   ⚠️  $var not found (may already be deleted)"
done

echo ""
echo "✅ Cleanup complete! Remaining secrets:"
supabase secrets list --project-ref $PROJECT_REF