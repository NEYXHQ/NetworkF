#!/bin/bash

# Simple Supabase secrets cleanup
# Usage: ./scripts/clean-supabase-simple.sh [environment]

set -e

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

# Reserved variables that should NOT be deleted
RESERVED_VARS=(
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "SUPABASE_DB_URL"
)

echo "🧹 Cleaning Supabase secrets"
echo "🌍 Environment: $ENV_NAME"
echo "📋 Project ID: $PROJECT_REF"
echo ""

# Get current secrets list and extract names
echo "🔍 Getting current secrets..."
SECRETS_OUTPUT=$(supabase secrets list --project-ref $PROJECT_REF)

# Extract secret names from the table (skip header and footer lines)
SECRET_NAMES=$(echo "$SECRETS_OUTPUT" | grep -v "NAME\|----" | awk '{print $1}' | grep -v "^$")

if [ -z "$SECRET_NAMES" ]; then
  echo "❌ No secrets found"
  exit 1
fi

echo "📋 Current secrets:"
echo "$SECRET_NAMES" | while read -r name; do
  echo "   - $name"
done
echo ""

# Filter secrets to delete
SECRETS_TO_DELETE=""
while read -r secret; do
  if [ -z "$secret" ]; then continue; fi

  # Check if reserved
  is_reserved=false
  for reserved in "${RESERVED_VARS[@]}"; do
    if [ "$secret" = "$reserved" ]; then
      is_reserved=true
      break
    fi
  done

  if [ "$is_reserved" = false ]; then
    SECRETS_TO_DELETE="$SECRETS_TO_DELETE $secret"
  fi
done <<< "$SECRET_NAMES"

if [ -z "$SECRETS_TO_DELETE" ]; then
  echo "✅ No non-reserved secrets to delete!"
  exit 0
fi

echo "🗑️  Secrets to delete:"
for secret in $SECRETS_TO_DELETE; do
  echo "   - $secret"
done
echo ""

# Confirmation
read -p "❓ Delete these secrets? (y/N): " confirm
case $confirm in
  [yY]|[yY][eE][sS]) ;;
  *) echo "❌ Cancelled"; exit 0 ;;
esac

# Delete secrets
echo "🚀 Deleting secrets..."
deleted=0
failed=0

for secret in $SECRETS_TO_DELETE; do
  echo "Deleting: $secret"
  if supabase secrets unset --project-ref $PROJECT_REF --yes "$secret" >/dev/null 2>&1; then
    echo "   ✅ Deleted: $secret"
    ((deleted++))
  else
    echo "   ❌ Failed: $secret"
    ((failed++))
  fi
done

echo ""
echo "🎉 Cleanup complete!"
echo "✅ Deleted: $deleted"
if [ $failed -gt 0 ]; then
  echo "❌ Failed: $failed"
fi

echo ""
echo "📋 Remaining secrets:"
supabase secrets list --project-ref $PROJECT_REF