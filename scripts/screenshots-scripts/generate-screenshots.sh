#!/bin/bash

# Script to generate comprehensive screenshots of all iTracksy pages for the landing page

echo "🖼️ Generating comprehensive screenshots for all iTracksy pages..."
echo ""
echo "📋 Pages that will be captured:"
echo "   • Activity Tracking (Focus Sessions)"
echo "   • Time Analytics Dashboard"
echo "   • Project Management (Kanban)"
echo "   • Activity Classification"
echo "   • Rule-Based Classification"
echo "   • Categorization Overview"
echo "   • Category Management"
echo "   • Uncategorized Activities"
echo "   • Reports"
echo "   • Music/Focus Enhancement"
echo "   • Scheduling"
echo "   • Settings"
echo ""

# Help function
show_help() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -h, --help     Show this help message"
  echo "  -v, --verbose  Show verbose output during build and test"
  echo "  --skip-build   Skip the build step (use existing build)"
  echo ""
  echo "Examples:"
  echo "  $0                    # Generate all screenshots with default settings"
  echo "  $0 --verbose          # Generate with verbose output"
  echo "  $0 --skip-build       # Skip build and only run screenshot tests"
  echo ""
}

# Parse command line arguments
VERBOSE=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Ensure we're in the project root
cd "$(dirname "$0")/../.." || exit

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

# Build the app first (unless skipped)
if [ "$SKIP_BUILD" = true ]; then
  echo "⏭️ Skipping build step as requested..."
else
  echo "📦 Building the app..."
  if [ "$VERBOSE" = true ]; then
    DEBUG=electron-forge:* npm run package
  else
    npm run package > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "✅ Build completed successfully!"
    else
      echo "❌ Build failed. Please check the build output."
      exit 1
    fi
  fi
fi

# Run the screenshot tests
echo "📸 Taking screenshots of all pages..."
if [ "$VERBOSE" = true ]; then
  npx playwright test src/tests/e2e/feature-screenshots.spec.ts
else
  npx playwright test src/tests/e2e/feature-screenshots.spec.ts --reporter=line
fi

# Check if screenshots were generated
if [ -d "./screenshots" ]; then
  echo "✅ Screenshots generated successfully in the 'screenshots' directory!"
  echo ""
  echo "📊 Generated screenshots:"
  find ./screenshots -name "*.png" -exec basename {} \; | sort
  echo ""
  echo "📈 Total screenshot count: $(find ./screenshots -name "*.png" | wc -l | tr -d ' ')"

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
