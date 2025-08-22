#!/bin/bash

# Script to test Azure Code Signing locally on macOS
# This will test the complete signing process before using it in GitHub Actions

set -e

echo "🧪 Testing Azure Code Signing locally..."

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️  No .env file found - using system environment variables"
fi

# Check if Azure credentials are set
if [[ -z "$AZURE_CLIENT_ID" ]]; then
    echo "❌ AZURE_CLIENT_ID not set"
    exit 1
fi

if [[ -z "$AZURE_CLIENT_SECRET" ]]; then
    echo "❌ AZURE_CLIENT_SECRET not set"
    exit 1
fi

if [[ -z "$AZURE_TENANT_ID" ]]; then
    echo "❌ AZURE_TENANT_ID not set"
    exit 1
fi

if [[ -z "$AZURE_SUBSCRIPTION_ID" ]]; then
    echo "❌ AZURE_SUBSCRIPTION_ID not set"
    exit 1
fi

echo "✅ Azure credentials found"

# Hardcoded certificate information (from your Azure screenshot)
IDENTITY_VALIDATION_ID="c11d3515-6b00-466f-9722-a778639be633"
CERTIFICATE_THUMBPRINT="B59513654510DCD5804280C1340A8723B11EE110"

echo "🎯 Using certificate:"
echo "   Identity Validation ID: $IDENTITY_VALIDATION_ID"
echo "   Certificate Thumbprint: $CERTIFICATE_THUMBPRINT"

# Check if Java is installed
echo ""
echo "☕ Checking Java installation..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n1)
    echo "✅ Java found: $JAVA_VERSION"
else
    echo "❌ Java not found. Please install Java 11 or later:"
    echo "   brew install openjdk@17"
    exit 1
fi

# Download JSign if not present
JSIGN_JAR="jsign-7.0.jar"
if [ ! -f "$JSIGN_JAR" ]; then
    echo ""
    echo "📥 Downloading JSign..."
    curl -L "https://github.com/ebourg/jsign/releases/download/7.0/jsign-7.0.jar" -o "$JSIGN_JAR"
    echo "✅ JSign downloaded"
else
    echo "✅ JSign already present"
fi

# Test Azure CLI login
echo ""
echo "🔐 Testing Azure CLI login..."
az login --service-principal \
    --username "$AZURE_CLIENT_ID" \
    --password "$AZURE_CLIENT_SECRET" \
    --tenant "$AZURE_TENANT_ID"

if [ $? -eq 0 ]; then
    echo "✅ Azure CLI login successful"
else
    echo "❌ Azure CLI login failed"
    exit 1
fi

# Set subscription
echo ""
echo "📋 Setting Azure subscription..."
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Get Azure access token for code signing
echo ""
echo "🎫 Getting access token for code signing..."
ACCESS_TOKEN=$(az account get-access-token --resource "https://codesigning.azure.net" --query accessToken -o tsv 2>/dev/null)

if [[ -n "$ACCESS_TOKEN" ]]; then
    echo "✅ Successfully obtained access token"
    echo "   Token: ${ACCESS_TOKEN:0:20}****"
else
    echo "❌ Failed to get access token"
    exit 1
fi

# Create a test executable to sign (we'll use a simple binary)
echo ""
echo "📁 Creating test file for signing..."
TEST_FILE="test-signing.exe"

# Create a minimal test executable (this won't work as a real program, but can be signed)
echo "Creating test binary..."
cat > test.c << 'EOF'
#include <stdio.h>
int main() {
    printf("Hello, World!\n");
    return 0;
}
EOF

# Try to compile with gcc if available, otherwise create a dummy file
if command -v gcc &> /dev/null; then
    gcc -o "$TEST_FILE" test.c 2>/dev/null || echo "Creating dummy executable..."
    rm -f test.c
fi

# If compilation failed or gcc not available, create a dummy PE file
if [ ! -f "$TEST_FILE" ]; then
    echo "Creating dummy test file..."
    # Create a minimal binary file that can be signed
    printf '\x4d\x5a\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00' > "$TEST_FILE"
    printf '\xb8\x00\x00\x00\x00\x00\x00\x00\x40\x00\x00\x00\x00\x00\x00\x00' >> "$TEST_FILE"
    chmod +x "$TEST_FILE"
fi

echo "✅ Test file created: $TEST_FILE"

# Test signing with JSign
echo ""
echo "🔏 Testing code signing..."
echo "Attempting to sign with Azure Trusted Signing..."

java -jar "$JSIGN_JAR" \
    --storetype TRUSTEDSIGNING \
    --keystore eus.codesigning.azure.net \
    --storepass "$ACCESS_TOKEN" \
    --alias "hung/$CERTIFICATE_THUMBPRINT" \
    --tsaurl http://timestamp.digicert.com \
    "$TEST_FILE"

SIGNING_RESULT=$?

if [ $SIGNING_RESULT -eq 0 ]; then
    echo ""
    echo "✅ SIGNING SUCCESSFUL!"
    echo ""

    # Verify the signature
    echo "🔍 Verifying signature..."
    java -jar "$JSIGN_JAR" --verify "$TEST_FILE"

    if [ $? -eq 0 ]; then
        echo "✅ Signature verification successful!"
    else
        echo "⚠️  Signature verification failed, but signing completed"
    fi

    echo ""
    echo "🎉 Azure Code Signing test PASSED!"
    echo "   Your certificate is working and can be used in GitHub Actions"

else
    echo ""
    echo "❌ SIGNING FAILED!"
    echo "   Exit code: $SIGNING_RESULT"
    echo ""
    echo "🔧 Possible issues:"
    echo "   1. Certificate may be expired or revoked"
    echo "   2. Azure subscription access may be limited"
    echo "   3. Certificate alias format may be incorrect"
    echo "   4. Access token may not have sufficient permissions"

    # Try alternative alias formats
    echo ""
    echo "🔄 Trying alternative certificate alias formats..."

    echo "Trying with identity validation ID..."
    java -jar "$JSIGN_JAR" \
        --storetype TRUSTEDSIGNING \
        --keystore eus.codesigning.azure.net \
        --storepass "$ACCESS_TOKEN" \
        --alias "hung/$IDENTITY_VALIDATION_ID" \
        --tsaurl http://timestamp.digicert.com \
        "$TEST_FILE" 2>&1 | head -10

    echo ""
    echo "Trying with just the thumbprint..."
    java -jar "$JSIGN_JAR" \
        --storetype TRUSTEDSIGNING \
        --keystore eus.codesigning.azure.net \
        --storepass "$ACCESS_TOKEN" \
        --alias "$CERTIFICATE_THUMBPRINT" \
        --tsaurl http://timestamp.digicert.com \
        "$TEST_FILE" 2>&1 | head -10
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
rm -f "$TEST_FILE" test.c

echo ""
echo "📋 Test Summary:"
echo "   Certificate Thumbprint: $CERTIFICATE_THUMBPRINT"
echo "   Identity Validation ID: $IDENTITY_VALIDATION_ID"
echo "   Azure Access: $([ $SIGNING_RESULT -eq 0 ] && echo 'Working ✅' || echo 'Failed ❌')"
echo ""
echo "🚀 Ready for GitHub Actions: $([ $SIGNING_RESULT -eq 0 ] && echo 'YES ✅' || echo 'NEEDS FIXES ❌')"
