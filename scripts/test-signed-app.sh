#!/bin/bash

# Script to build and test the signed app with browser URL access
# This script builds the production app and tests Apple Events permissions

set -e

echo "🚀 Building and testing iTracksy with browser URL access..."

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️  No .env file found"
fi

# Set production environment
export NODE_ENV=production

# Check if Apple Developer credentials are set
if [[ -z "$APPLE_ID" || -z "$APPLE_ID_PASSWORD" || -z "$APPLE_TEAM_ID" ]]; then
    echo "⚠️  Warning: Apple Developer credentials not set"
    echo "   Set APPLE_ID, APPLE_ID_PASSWORD, and APPLE_TEAM_ID for full signing and notarization"
    echo "   Building without notarization..."

    # Build without notarization
    npm run make -- --platform=darwin
else
    echo "✅ Apple Developer credentials found, building with full signing and notarization..."
    npm run make -- --platform=darwin
fi

# Find the built app
APP_PATH=$(find out -name "*.app" -type d | head -1)

if [[ -z "$APP_PATH" ]]; then
    echo "❌ Could not find built .app file"
    exit 1
fi

echo "📱 Built app found at: $APP_PATH"

# Check code signing
echo "\n🔍 Checking code signature..."
codesign -dv --verbose=4 "$APP_PATH" 2>&1 | head -20

# Check entitlements
echo "\n🔐 Checking entitlements..."
codesign -d --entitlements - "$APP_PATH"

# Test the app (this will open the app)
echo "\n🧪 Testing the signed app..."
echo "1. The app will open - test browser URL tracking functionality"
echo "2. Check that URLs are being captured from browsers"
echo "3. Grant Apple Events permission when prompted"

# Open the app
open "$APP_PATH"

echo "\n✅ Build and test process completed!"
echo "📋 Next steps:"
echo "   1. Test browser URL tracking in the opened app"
echo "   2. Check that Apple Events permission is requested"
echo "   3. Verify that browser URLs are captured correctly"
