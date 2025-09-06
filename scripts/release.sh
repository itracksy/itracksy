#!/bin/bash

# Release script for itracksy
# Usage: ./scripts/release.sh [version_increment|version_number] [--draft|--no-draft]
# Examples:
#   ./scripts/release.sh patch --draft
#   ./scripts/release.sh 1.2.3 --no-draft
#   ./scripts/release.sh minor --draft
#   ./scripts/release.sh --no-draft

# Default settings
DRAFT_RELEASE="true"  # Default to draft releases for safety

# Parse command line arguments
ARGS=()
while [[ $# -gt 0 ]]; do
    case $1 in
        --draft)
            DRAFT_RELEASE="true"
            shift
            ;;
        --no-draft)
            DRAFT_RELEASE="false"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [version_increment|version_number] [--draft|--no-draft]"
            echo ""
            echo "Version increment options:"
            echo "  major       Increment major version (x.0.0)"
            echo "  minor       Increment minor version (x.y.0)"
            echo "  patch       Increment patch version (x.y.z) [default]"
            echo "  x.y.z       Set specific version number"
            echo ""
            echo "Release options:"
            echo "  --draft     Create draft release (default)"
            echo "  --no-draft  Create public release immediately"
            echo ""
            echo "Examples:"
            echo "  $0 patch --draft"
            echo "  $0 1.2.3 --no-draft"
            echo "  $0 minor --draft"
            exit 0
            ;;
        *)
            ARGS+=("$1")
            shift
            ;;
    esac
done

# Set environment variable for forge config
export GITHUB_RELEASE_DRAFT="$DRAFT_RELEASE"

echo "Release configuration:"
echo "  Draft release: $DRAFT_RELEASE"
echo ""

# Function to validate version number
validate_version() {
    if [[ ! $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "Error: Version must be in format x.y.z (e.g., 1.0.0)"
        exit 1
    fi
}

# Function to get current version from package.json
get_current_version() {
    node -p "require('./package.json').version"
}

# Function to increment version
increment_version() {
    local version=$1
    local increment_type=$2

    IFS='.' read -ra VERSION_PARTS <<< "$version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}

    case $increment_type in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
    esac

    echo "${major}.${minor}.${patch}"
}

# Run type-check and ensure it succeeds
run_type_check() {
    echo "Running type check..."
    npm run type-check

    if [ $? -ne 0 ]; then
        echo "Error: Type check failed. Release aborted."
        exit 1
    fi

    echo "Type check passed. Proceeding with release..."
}

# Run type check first
run_type_check

# Get the current version
CURRENT_VERSION=$(get_current_version)
echo "Current version: $CURRENT_VERSION"

# Determine version increment type from parsed arguments
VERSION_ARG="${ARGS[0]}"

if [ "$VERSION_ARG" = "major" ] || [ "$VERSION_ARG" = "minor" ] || [ "$VERSION_ARG" = "patch" ]; then
    NEW_VERSION=$(increment_version $CURRENT_VERSION $VERSION_ARG)
elif [ -n "$VERSION_ARG" ]; then
    NEW_VERSION=$VERSION_ARG
    validate_version $NEW_VERSION
else
    NEW_VERSION=$(increment_version $CURRENT_VERSION "patch")
fi

echo "New version will be: $NEW_VERSION"

# Update version in package.json
npm version $NEW_VERSION --no-git-tag-version

# Stage changes
git add package.json

# Commit changes
git commit -m "chore: bump version to $NEW_VERSION"

# Create and push tag
git tag "v$NEW_VERSION"
git push origin main
git push origin "v$NEW_VERSION"

echo "Version $NEW_VERSION has been tagged and pushed!"
if [ "$DRAFT_RELEASE" = "true" ]; then
    echo "GitHub Actions will now build and create a DRAFT release."
    echo "Remember to manually publish the release when ready."
else
    echo "GitHub Actions will now build and publish the release IMMEDIATELY."
fi
