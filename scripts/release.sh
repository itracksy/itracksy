#!/bin/bash

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

# Determine version increment type
if [ "$1" = "major" ] || [ "$1" = "minor" ] || [ "$1" = "patch" ]; then
    NEW_VERSION=$(increment_version $CURRENT_VERSION $1)
elif [ -n "$1" ]; then
    NEW_VERSION=$1
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
echo "GitHub Actions will now build and publish the release."
