#!/bin/bash

# Script to test Apple ID credentials for notarization
# This only tests the credentials without building the app

set -e

echo "🔐 Testing Apple ID credentials for notarization..."

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️  No .env file found"
fi

# Check if Apple Developer credentials are set
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

echo "✅ Found credentials:"
echo "   APPLE_ID: $APPLE_ID"
echo "   APPLE_ID_PASSWORD: ${APPLE_ID_PASSWORD:0:4}****${APPLE_ID_PASSWORD: -4}"
echo "   APPLE_TEAM_ID: $APPLE_TEAM_ID"

# Test the credentials using notarytool
echo ""
echo "🧪 Testing credentials with notarytool..."

# Use xcrun notarytool to validate credentials
# This will test authentication without submitting anything
echo "Testing authentication..."
xcrun notarytool history --apple-id "$APPLE_ID" --password "$APPLE_ID_PASSWORD" --team-id "$APPLE_TEAM_ID" --output-format json 2>&1

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "✅ Apple ID credentials are valid!"
    echo "   Authentication successful with notarytool"
else
    echo ""
    echo "❌ Apple ID credentials failed!"
    echo "   Exit code: $RESULT"
    echo "   Please check:"
    echo "   1. APPLE_ID is correct email address"
    echo "   2. APPLE_ID_PASSWORD is an app-specific password from appleid.apple.com"
    echo "   3. APPLE_TEAM_ID matches your Apple Developer team"
fi
