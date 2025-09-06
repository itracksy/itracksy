#!/bin/bash

# Script to clean up GitHub releases, keeping only the 10 most recent ones
# Usage: ./scripts/cleanup-releases.sh [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
DRY_RUN=false
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--dry-run]"
            echo ""
            echo "Options:"
            echo "  --dry-run   Show what would be deleted without actually deleting"
            echo "  --help      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--dry-run]"
            exit 1
            ;;
    esac
done

REPO="hunght/itracksy"
KEEP_COUNT=10

echo -e "${BLUE}🔐 Checking GitHub CLI authentication...${NC}"

# Clear any GITHUB_TOKEN environment variable that might interfere
if [ -n "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Clearing GITHUB_TOKEN environment variable...${NC}"
    unset GITHUB_TOKEN
fi

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo -e "${YELLOW}💡 Install it with: brew install gh${NC}"
    exit 1
fi

# Check authentication status
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI is not authenticated${NC}"
    echo -e "${YELLOW}💡 Please run: gh auth login${NC}"
    exit 1
else
    # Extract the username from auth status
    USERNAME=$(gh auth status 2>&1 | grep "Logged in to github.com account" | sed 's/.*account \([^ ]*\).*/\1/')
    echo -e "${GREEN}✅ Already authenticated as: ${USERNAME}${NC}"
fi

# Check if we have repo access by trying to fetch basic repo info
echo -e "${BLUE}🔍 Verifying repository access...${NC}"
if ! gh api repos/"$REPO" --jq '.name' &> /dev/null; then
    echo -e "${RED}❌ Cannot access repository: ${REPO}${NC}"
    echo -e "${YELLOW}💡 Make sure you have access to the repository and try: gh auth refresh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Repository access verified${NC}"
echo ""

echo -e "${BLUE}🔍 Fetching releases from ${REPO}...${NC}"

# Get all releases using GitHub API, sorted by creation date (newest first)
# Format: tag_name
echo -e "${BLUE}📡 Fetching releases from GitHub API...${NC}"
if ! RELEASES=$(gh api repos/"$REPO"/releases --jq '.[].tag_name' 2>/dev/null); then
    echo -e "${RED}❌ Failed to fetch releases from ${REPO}${NC}"
    echo -e "${YELLOW}💡 Debug: Let's check what's happening...${NC}"
    echo -e "${BLUE}🔍 Testing API access:${NC}"
    gh api repos/"$REPO"/releases --jq '.[].tag_name' || true
    echo -e "${YELLOW}💡 If you see authentication errors above, try: gh auth login${NC}"
    exit 1
fi

if [ -z "$RELEASES" ]; then
    echo -e "${YELLOW}⚠️  No releases found${NC}"
    exit 0
fi

# Convert to array
RELEASE_ARRAY=()
while IFS= read -r line; do
    RELEASE_ARRAY+=("$line")
done <<< "$RELEASES"

TOTAL_RELEASES=${#RELEASE_ARRAY[@]}
echo -e "${BLUE}📊 Found ${TOTAL_RELEASES} releases${NC}"

if [ $TOTAL_RELEASES -le $KEEP_COUNT ]; then
    echo -e "${GREEN}✅ Only ${TOTAL_RELEASES} releases found. Nothing to clean up (keeping ${KEEP_COUNT}).${NC}"
    exit 0
fi

RELEASES_TO_DELETE=$((TOTAL_RELEASES - KEEP_COUNT))
echo -e "${YELLOW}🧹 Will delete ${RELEASES_TO_DELETE} old releases (keeping newest ${KEEP_COUNT})${NC}"
echo ""

# Show which releases will be kept
echo -e "${GREEN}✅ Releases to KEEP (newest ${KEEP_COUNT}):${NC}"
for i in $(seq 0 $((KEEP_COUNT - 1))); do
    if [ $i -lt $TOTAL_RELEASES ]; then
        echo -e "   ${GREEN}${RELEASE_ARRAY[$i]}${NC}"
    fi
done
echo ""

# Show which releases will be deleted
echo -e "${RED}🗑️  Releases to DELETE:${NC}"
for i in $(seq $KEEP_COUNT $((TOTAL_RELEASES - 1))); do
    if [ $i -lt $TOTAL_RELEASES ]; then
        echo -e "   ${RED}${RELEASE_ARRAY[$i]}${NC}"
    fi
done
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}🔍 DRY RUN MODE - No releases will be deleted${NC}"
    echo -e "${BLUE}💡 Run without --dry-run to actually delete the releases${NC}"
    exit 0
fi

# Ask for confirmation
echo -e "${YELLOW}⚠️  This will permanently delete ${RELEASES_TO_DELETE} releases!${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}❌ Operation cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${RED}🚀 Starting deletion process...${NC}"

# Delete releases starting from the oldest
DELETED_COUNT=0
FAILED_COUNT=0

for i in $(seq $KEEP_COUNT $((TOTAL_RELEASES - 1))); do
    if [ $i -lt $TOTAL_RELEASES ]; then
        RELEASE_TAG="${RELEASE_ARRAY[$i]}"
        echo -e "${BLUE}🗑️  Deleting release: ${RELEASE_TAG}${NC}"

        if gh release delete "$RELEASE_TAG" --repo "$REPO" --yes 2>/dev/null; then
            echo -e "   ${GREEN}✅ Successfully deleted ${RELEASE_TAG}${NC}"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        else
            # Try to get more specific error information
            ERROR_MSG=$(gh release delete "$RELEASE_TAG" --repo "$REPO" --yes 2>&1 || true)
            echo -e "   ${RED}❌ Failed to delete ${RELEASE_TAG}${NC}"
            echo -e "   ${YELLOW}   Error: ${ERROR_MSG}${NC}"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi

        # Small delay to avoid rate limiting
        sleep 1
    fi
done

echo ""
echo -e "${GREEN}🎉 Cleanup completed!${NC}"
echo -e "${GREEN}   ✅ Successfully deleted: ${DELETED_COUNT} releases${NC}"
if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "${RED}   ❌ Failed to delete: ${FAILED_COUNT} releases${NC}"
fi
echo -e "${BLUE}   📊 Releases remaining: ${KEEP_COUNT}${NC}"
