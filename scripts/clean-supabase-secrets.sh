#!/bin/bash

# Clean Supabase Secrets Script
# Deletes all environment variables except reserved ones
# Usage: ./scripts/clean-supabase-secrets.sh [project-ref]

set -e

# Default project ref (can be overridden)
PROJECT_REF=${1:-"mnmlmectnlcrbnlhxyrp"}

# Reserved variables that should NOT be deleted
RESERVED_VARS=(
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "SUPABASE_DB_URL"
)

echo "🧹 Cleaning Supabase secrets for project: $PROJECT_REF"
echo "📋 Reserved variables (will NOT be deleted):"
for var in "${RESERVED_VARS[@]}"; do
  echo "   - $var"
done
echo ""

# Get list of all current secrets
echo "🔍 Fetching current secrets..."
CURRENT_SECRETS=$(supabase secrets list --project-ref $PROJECT_REF -o json | jq -r '.[].name' 2>/dev/null)

if [ -z "$CURRENT_SECRETS" ]; then
  echo "❌ No secrets found or unable to fetch secrets"
  exit 1
fi

echo "📝 Current secrets found:"
echo "$CURRENT_SECRETS" | while read -r secret; do
  echo "   - $secret"
done
echo ""

# Filter out reserved variables
SECRETS_TO_DELETE=""
while IFS= read -r secret; do
  # Skip empty lines
  if [ -z "$secret" ]; then
    continue
  fi

  # Check if this secret is in the reserved list
  is_reserved=false
  for reserved in "${RESERVED_VARS[@]}"; do
    if [ "$secret" = "$reserved" ]; then
      is_reserved=true
      break
    fi
  done

  # If not reserved, add to deletion list
  if [ "$is_reserved" = false ]; then
    if [ -z "$SECRETS_TO_DELETE" ]; then
      SECRETS_TO_DELETE="$secret"
    else
      SECRETS_TO_DELETE="$SECRETS_TO_DELETE\n$secret"
    fi
  fi
done <<< "$CURRENT_SECRETS"

# Check if there are any secrets to delete
if [ -z "$SECRETS_TO_DELETE" ]; then
  echo "✅ No non-reserved secrets to delete. All clean!"
  exit 0
fi

echo "🗑️  Secrets to be deleted:"
echo -e "$SECRETS_TO_DELETE" | while read -r secret; do
  if [ -n "$secret" ]; then
    echo "   - $secret"
  fi
done
echo ""

# Confirmation prompt
read -p "❓ Are you sure you want to delete these secrets? This action cannot be undone! (y/N): " confirmation
case $confirmation in
  [yY]|[yY][eE][sS])
    echo "🚀 Proceeding with deletion..."
    ;;
  *)
    echo "❌ Deletion cancelled by user"
    exit 0
    ;;
esac

# Delete each non-reserved secret
deleted_count=0
failed_count=0

echo -e "$SECRETS_TO_DELETE" | while read -r secret; do
  if [ -n "$secret" ]; then
    echo "🗑️  Deleting: $secret"
    if supabase secrets unset --project-ref $PROJECT_REF "$secret" >/dev/null 2>&1; then
      echo "   ✅ Successfully deleted: $secret"
      ((deleted_count++))
    else
      echo "   ❌ Failed to delete: $secret"
      ((failed_count++))
    fi
  fi
done

echo ""
echo "🎉 Cleanup complete!"
echo "✅ Deleted: $deleted_count secrets"
if [ $failed_count -gt 0 ]; then
  echo "❌ Failed: $failed_count secrets"
fi

# Show remaining secrets
echo ""
echo "📋 Remaining secrets:"
supabase secrets list --project-ref $PROJECT_REF -o json | jq -r '.[].name' 2>/dev/null | while read -r secret; do
  if [ -n "$secret" ]; then
    echo "   - $secret"
  fi
done