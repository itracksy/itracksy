#!/bin/bash

# Check if a tag was provided
if [ -z "$1" ]; then
    echo "Error: Please provide a tag name"
    echo "Usage: ./revert-to-tag.sh <tag_name>"
    exit 1
fi

TAG_NAME=$1

# Check if the tag exists
if ! git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo "Error: Tag '$TAG_NAME' does not exist"
    exit 1
fi

# Make sure we're on main branch and it's up to date
echo "Checking out main branch and updating..."
git checkout main
git fetch origin
git reset --hard origin/main

# Create revert commit
echo "Reverting changes to $TAG_NAME..."
if git revert --no-commit $TAG_NAME..HEAD; then
    # Commit the changes
    git commit -m "Revert changes to restore $TAG_NAME state"
    
    # Push changes
    echo "Pushing changes to remote..."
    if git push origin main; then
        echo "Successfully reverted to $TAG_NAME state"
    else
        echo "Error: Failed to push changes"
        exit 1
    fi
else
    echo "Error: Failed to revert changes"
    git revert --abort
    exit 1
fi
