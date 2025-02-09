#!/bin/bash

# Set production environment
export NODE_ENV=production

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Debugging Code Signing Process${NC}"

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script must be run on macOS${NC}"
    exit 1
fi

# Load environment variables from .env.local
echo -e "\n${BLUE}Loading environment variables from .env.local...${NC}"
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ Loaded .env.local${NC}"
else
    echo -e "${RED}❌ .env.local file not found${NC}"
    exit 1
fi

# Check for required environment variables
echo -e "\n${BLUE}Checking environment variables...${NC}"
REQUIRED_VARS=("APPLE_SIGNING_IDENTITY" "APPLE_ID" "APPLE_ID_PASSWORD" "APPLE_TEAM_ID")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf '%s\n' "${MISSING_VARS[@]}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables check passed${NC}"

# Check for required certificates
echo -e "\n${BLUE}Checking certificates...${NC}"
security find-identity -v | grep -q "$APPLE_SIGNING_IDENTITY"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Certificate not found: $APPLE_SIGNING_IDENTITY${NC}"
    echo "Available certificates:"
    security find-identity -v
    exit 1
fi

echo -e "${GREEN}✅ Certificate found${NC}"

# Clean previous builds
echo -e "\n${BLUE}Cleaning previous builds...${NC}"
rm -rf out/
rm -rf release/

# Build the app
echo -e "\n${BLUE}Building the app...${NC}"
npm run make

# Verify code signing
echo -e "\n${BLUE}Verifying code signing...${NC}"
APP_PATH="out/itracksy-darwin-arm64/itracksy.app"
if [ ! -d "$APP_PATH" ]; then
    APP_PATH="out/itracksy-darwin-x64/itracksy.app"
fi

if [ ! -d "$APP_PATH" ]; then
    echo -e "${RED}❌ Could not find built app${NC}"
    exit 1
fi

echo -e "\nCode signing info:"
codesign -dvv "$APP_PATH"

echo -e "\nVerifying code signing:"
codesign --verify --deep --strict "$APP_PATH"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code signing verification passed${NC}"
else
    echo -e "${RED}❌ Code signing verification failed${NC}"
fi

echo -e "\n${BLUE}Checking entitlements:${NC}"
codesign -d --entitlements :- "$APP_PATH"
