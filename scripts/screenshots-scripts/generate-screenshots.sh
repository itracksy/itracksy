#!/bin/bash

# Script to generate screenshots of main features for the landing page

echo "🖼️ Generating screenshots for iTracksy landing page..."

# Ensure we're in the project root
cd "$(dirname "$0")/.." || exit

# Check for .env file and load environment variables
if [ -f ".env" ]; then
  echo "📚 Loading environment variables from .env file..."
  set -a
  source .env
  set +a
  echo "✅ Environment variables loaded successfully!"
else
  echo "⚠️ No .env file found. Using default environment variables."
fi

# Build the app first with debug flag
echo "📦 Building the app in debug mode..."
DEBUG=electron-forge:* npm run package

# Run the screenshot tests
echo "📸 Taking screenshots..."
npx playwright test src/tests/e2e/feature-screenshots.spec.ts

# Check if screenshots were generated
if [ -d "./screenshots" ]; then
  echo "✅ Screenshots generated successfully in the 'screenshots' directory!"
  echo "📊 Screenshot count: $(find ./screenshots -name "*.png" | wc -l | tr -d ' ')"
  ls -la ./screenshots

  # Move screenshots to itracksy-web/public
  echo "🚚 Moving screenshots to ../itracksy-web/public/screenshots..."

  # Create directory if it doesn't exist
  mkdir -p "../itracksy-web/public/screenshots"

  # Ensure the directory is empty before copying
  rm -rf "../itracksy-web/public/screenshots/"*

  # Copy all screenshots
  cp -R ./screenshots/* "../itracksy-web/public/screenshots/"

  # Check if copy was successful
  if [ $? -eq 0 ]; then
    echo "✅ Screenshots successfully moved to ../itracksy-web/public/screenshots/"
    ls -la "../itracksy-web/public/screenshots"
  else
    echo "❌ Failed to move screenshots. Please check if ../itracksy-web/public directory exists."
  fi
else
  echo "❌ Failed to generate screenshots. Please check the test output for errors."
fi

echo "Done! 🎉"
