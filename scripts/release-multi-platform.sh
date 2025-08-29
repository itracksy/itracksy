#!/bin/bash

# Multi-Platform Release Script for iTracksy
# This script helps create releases for all platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "forge.config.ts" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You're not on the main branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if version tag already exists
if git tag -l | grep -q "v$CURRENT_VERSION"; then
    print_warning "Version tag v$CURRENT_VERSION already exists"
    read -p "Continue with existing tag? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_status "Creating version tag v$CURRENT_VERSION"
    git tag "v$CURRENT_VERSION"
fi

# Push the tag to trigger GitHub Actions
print_status "Pushing tag to GitHub to trigger multi-platform build..."
git push origin "v$CURRENT_VERSION"

print_success "Release process started!"
print_status "GitHub Actions will now build for all platforms:"
echo "  • macOS (Intel & Apple Silicon)"
echo "  • Windows (x64)"
echo "  • Linux (x64)"
echo ""
print_status "Monitor the build progress at:"
echo "  https://github.com/hunght/itracksy/actions"
echo ""
print_status "Once complete, the release will be available at:"
echo "  https://github.com/hunght/itracksy/releases/tag/v$CURRENT_VERSION"
echo ""
print_status "Users will receive auto-updates within 24 hours"

# Optional: Open GitHub Actions in browser
read -p "Open GitHub Actions in browser? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://github.com/hunght/itracksy/actions"
fi
