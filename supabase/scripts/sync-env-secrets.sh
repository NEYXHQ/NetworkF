#!/usr/bin/env bash

# Supabase Environment Secrets Sync Script
# Automatically syncs environment variables from .env.supabase.dev or .env.supabase.prd
# to the corresponding Supabase project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${BLUE}🔄 Supabase Environment Secrets Sync${NC}"
echo "======================================"
echo ""
echo "This script will:"
echo "• Read your .env.supabase.dev or .env.supabase.prd file"
echo "• Delete existing secrets with the same names"
echo "• Create new secrets with values from the file"
echo "• Auto-confirm all operations (no manual intervention)"
echo ""

# Function to check if supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}❌ Supabase CLI is not installed${NC}"
        echo "Please install it with: npm install -g supabase"
        exit 1
    fi
}

# Function to prompt for environment selection
select_environment() {
    echo -e "${YELLOW}📋 Select environment to sync:${NC}"
    echo "1) Development (dev)"
    echo "2) Production (prod)"
    echo ""
    read -p "Enter your choice (1 or 2): " choice

    case $choice in
        1)
            ENV="dev"
            ENV_FILE="$PROJECT_ROOT/.env.supabase.dev"
            ;;
        2)
            ENV="prod"
            ENV_FILE="$PROJECT_ROOT/.env.supabase.prd"
            ;;
        *)
            echo -e "${RED}❌ Invalid choice. Please select 1 or 2${NC}"
            exit 1
            ;;
    esac

    echo -e "${GREEN}✅ Selected: $ENV environment${NC}"
    echo ""
}

# Function to check if environment file exists
check_env_file() {
    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
        echo "Please create the file with your Supabase secrets"
        exit 1
    fi

    echo -e "${GREEN}✅ Found environment file: $ENV_FILE${NC}"
}

# Arrays for environment variables (compatible with older bash)
ENV_KEYS=()
ENV_VALUES=()

# Function to parse environment file and extract non-commented variables
parse_env_file() {
    echo -e "${BLUE}📖 Parsing environment file...${NC}"

    # Clear the arrays first
    ENV_KEYS=()
    ENV_VALUES=()

    # Read file line by line
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip empty lines and comments
        if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        # Extract key=value pairs
        if [[ "$line" =~ ^[[:space:]]*([^=]+)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"

            # Trim whitespace
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs)

            # Remove quotes if present
            if [[ "$value" =~ ^\"(.*)\"$ ]] || [[ "$value" =~ ^\'(.*)\'$ ]]; then
                value="${BASH_REMATCH[1]}"
            fi

            ENV_KEYS+=("$key")
            ENV_VALUES+=("$value")
            echo -e "  ${GREEN}•${NC} Found: $key"
        fi
    done < "$ENV_FILE"

    echo -e "${GREEN}✅ Parsed ${#ENV_KEYS[@]} environment variables${NC}"
    echo ""
}

# Function to extract project ID from environment files
get_project_id() {
    local env_file=""

    if [[ "$ENV" == "dev" ]]; then
        env_file="$PROJECT_ROOT/.env.development"
    else
        env_file="$PROJECT_ROOT/.env.production"
    fi

    if [[ -f "$env_file" ]]; then
        # Extract project ID from VITE_SUPABASE_PROJECT_ID or VITE_SUPABASE_URL
        local project_id=""

        # Try to get from PROJECT_ID first
        project_id=$(grep "VITE_SUPABASE_PROJECT_ID" "$env_file" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | xargs)

        # If not found, try to extract from URL
        if [[ -z "$project_id" ]]; then
            local supabase_url=$(grep "VITE_SUPABASE_URL" "$env_file" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | xargs)
            if [[ "$supabase_url" =~ https://([^.]+)\.supabase\.co ]]; then
                project_id="${BASH_REMATCH[1]}"
            fi
        fi

        echo "$project_id"
    fi
}

# Function to get the project reference for the selected environment
get_project_ref() {
    if [[ "$ENV" == "dev" ]]; then
        echo "kxepoivhqnurxmkgiojo"
    else
        echo "mnmlmectnlcrbnlhxyrp"
    fi
}

# Function to sync secrets to Supabase
sync_secrets() {
    echo -e "${BLUE}🔄 Syncing secrets to Supabase ($ENV)...${NC}"
    echo ""

    # Get project reference
    local project_ref=$(get_project_ref)
    echo -e "${YELLOW}ℹ️  Using project: $project_ref${NC}"
    echo ""

    # Counter for operations
    local deleted_count=0
    local created_count=0
    local skipped_count=0

    # Get current secrets list
    local current_secrets=""
    if ! current_secrets=$(supabase secrets list --project-ref "$project_ref" 2>/dev/null); then
        echo -e "${RED}❌ Failed to fetch current secrets list${NC}"
        echo "Please check your Supabase CLI connection and project access"
        exit 1
    fi

    # Loop through the arrays using indices
    for i in "${!ENV_KEYS[@]}"; do
        key="${ENV_KEYS[$i]}"
        value="${ENV_VALUES[$i]}"

        echo -e "${YELLOW}Processing: $key${NC}"

        # Always try to delete the secret first (safer approach)
        echo -e "  ${YELLOW}🗑️  Attempting to delete existing secret (if any)...${NC}"

        # Delete existing secret with auto-confirm (ignore errors if it doesn't exist)
        if supabase secrets unset "$key" --project-ref "$project_ref" --yes 2>/dev/null; then
            echo -e "  ${GREEN}✅ Deleted existing secret${NC}"
            ((deleted_count++))
        else
            echo -e "  ${BLUE}ℹ️  No existing secret to delete (or deletion failed)${NC}"
        fi

        # Set new secret value
        echo -e "  ${BLUE}📝 Setting new value...${NC}"

        # Use proper NAME=VALUE format as required by Supabase CLI
        if supabase secrets set "$key=$value" --project-ref "$project_ref"; then
            echo -e "  ${GREEN}✅ Secret set successfully${NC}"
            ((created_count++))
        else
            echo -e "  ${RED}❌ Failed to set secret${NC}"
            echo -e "  ${RED}   Key: $key${NC}"
            echo -e "  ${RED}   Value length: ${#value} characters${NC}"
            echo -e "  ${RED}   First few chars: ${value:0:10}...${NC}"
            echo -e "  ${RED}   Debug: Running with --debug flag...${NC}"

            # Show debug output for troubleshooting
            echo -e "  ${YELLOW}   Debug output:${NC}"
            supabase secrets set "$key=$value" --project-ref "$project_ref" --debug 2>&1 | sed 's/^/     /'
            ((skipped_count++))
        fi

        echo ""
    done

    # Summary
    echo -e "${GREEN}🎉 Sync completed!${NC}"
    echo "========================"
    echo -e "${GREEN}✅ Created/Updated: $created_count secrets${NC}"
    echo -e "${YELLOW}🗑️  Deleted old: $deleted_count secrets${NC}"
    if [[ $skipped_count -gt 0 ]]; then
        echo -e "${RED}❌ Failed: $skipped_count secrets${NC}"
    fi
    echo ""
}

# Function to display current secrets (optional verification)
verify_secrets() {
    echo ""
    read -p "Would you like to verify the secrets were set correctly? (y/N): " verify_choice

    if [[ "$verify_choice" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}📋 Current Supabase secrets:${NC}"
        echo "================================"
        supabase secrets list
    fi
}

# Main execution
main() {
    check_supabase_cli
    select_environment
    check_env_file
    parse_env_file

    # Confirm before proceeding
    echo -e "${YELLOW}⚠️  This will delete and recreate secrets in your $ENV Supabase project${NC}"
    read -p "Are you sure you want to continue? (y/N): " confirm

    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🚫 Operation cancelled${NC}"
        exit 0
    fi

    sync_secrets
    verify_secrets

    echo ""
    echo -e "${GREEN}🎉 Environment sync completed successfully!${NC}"
}

# Run main function
main "$@"