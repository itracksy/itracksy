#!/bin/bash

# Script to test Apple notarization credentials without building
# This will verify if your Apple ID and app-specific password are correct

set -e

echo "🧪 Testing Apple notarization credentials..."

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️  No .env file found"
fi

# Check if credentials are set
if [[ -z "$APPLE_ID" ]]; then
    echo "❌ APPLE_ID not set"
    exit 1
fi

if [[ -z "$APPLE_ID_PASSWORD" ]]; then
    echo "❌ APPLE_ID_PASSWORD not set"
    exit 1
fi

if [[ -z "$APPLE_TEAM_ID" ]]; then
    echo "❌ APPLE_TEAM_ID not set"
    exit 1
fi

echo "✅ Credentials found:"
echo "   APPLE_ID: $APPLE_ID"
echo "   APPLE_TEAM_ID: $APPLE_TEAM_ID"
echo "   APPLE_ID_PASSWORD: ${APPLE_ID_PASSWORD:0:4}****"

# Test the credentials by checking notarization history
echo ""
echo "🔍 Testing credentials with notarytool..."
echo "This will check your notarization history to verify credentials..."

# Use xcrun notarytool to test credentials with timeout
timeout 30 xcrun notarytool history \
    --apple-id "$APPLE_ID" \
    --password "$APPLE_ID_PASSWORD" \
    --team-id "$APPLE_TEAM_ID" \
    2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Apple notarization credentials are valid!"
    echo "📝 Your credentials work correctly for notarization."
else
    echo ""
    echo "❌ FAILED! Apple notarization credentials are invalid!"
    echo "🔧 Please check:"
    echo "   1. APPLE_ID is your Apple ID email"
    echo "   2. APPLE_ID_PASSWORD is an app-specific password from appleid.apple.com"
    echo "   3. APPLE_TEAM_ID is your correct Apple Developer Team ID"
    exit 1
fi
