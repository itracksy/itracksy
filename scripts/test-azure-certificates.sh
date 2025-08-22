#!/bin/bash

# Script to test Azure Code Signing certificate access
# This validates if your Azure credentials can access the certificates

set -e

echo "🔍 Testing Azure Code Signing certificate access..."

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

echo "✅ Azure credentials found:"
echo "   AZURE_CLIENT_ID: ${AZURE_CLIENT_ID:0:8}****"
echo "   AZURE_TENANT_ID: ${AZURE_TENANT_ID:0:8}****"
echo "   AZURE_SUBSCRIPTION_ID: ${AZURE_SUBSCRIPTION_ID:0:8}****"

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

# Try to get access token for code signing
echo ""
echo "🎫 Testing access token for code signing..."
ACCESS_TOKEN=$(az account get-access-token --resource "https://codesigning.azure.net" --query accessToken -o tsv 2>/dev/null)

if [[ -n "$ACCESS_TOKEN" ]]; then
    echo "✅ Successfully obtained access token for code signing"
    echo "   Token: ${ACCESS_TOKEN:0:20}****"

    # Try to list trusted signing accounts (this might fail if subscription expired)
    echo ""
    echo "📜 Attempting to list trusted signing accounts..."
    az trustedsigning list 2>/dev/null || echo "⚠️  Cannot list accounts (subscription may be expired, but certificates might still work)"

else
    echo "❌ Failed to get access token for code signing"
    exit 1
fi

echo ""
echo "🎯 Certificate Information to Use:"
echo "   Identity Validation ID: c11d3515-6b00-466f-9722-a778639be633"
echo "   Certificate Thumbprint: B59513654510DCD5804280C1340A8723B11EE110"
echo "   Subject: CN=THE HUNG HOANG, O=THE HUNG HOANG, L=Vinh Yen, S=Vinh Phuc, C=VN"
echo ""
echo "✅ Azure certificate access test completed successfully!"
echo "   Even if the subscription is expired, you should be able to use the active certificates."
