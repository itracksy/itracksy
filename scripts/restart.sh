#!/bin/bash

# Restart itracksy project with fresh dependencies
# This script kills all running Electron processes and clears Vite cache for a fresh restart
# Usage: ./restart.sh [--start]
# Options:
#   --start    Automatically start the app after killing processes

set -e

# Parse command line arguments
START_APP=false
for arg in "$@"; do
    case $arg in
        --start)
            START_APP=true
            shift
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--start]"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# App names to search for
APP_NAME="itracksy"
PRODUCT_NAME="itracksy"

echo -e "${BLUE}🔍 Searching for running Electron processes for ${APP_NAME}...${NC}"

# Function to kill processes by name
kill_by_name() {
    local name=$1
    local pids=$(pgrep -f "$name" 2>/dev/null || true)

    if [ -n "$pids" ]; then
        echo -e "${YELLOW}📦 Found processes for '$name': $pids${NC}"
        for pid in $pids; do
            echo -e "${RED}🔪 Killing process $pid ($name)${NC}"
            kill -TERM "$pid" 2>/dev/null || true
            sleep 0.5
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${RED}💀 Force killing process $pid${NC}"
                kill -KILL "$pid" 2>/dev/null || true
            fi
        done
    else
        echo -e "${GREEN}✅ No processes found for '$name'${NC}"
    fi
}

# Function to kill processes by pattern
kill_by_pattern() {
    local pattern=$1
    local description=$2
    local pids=$(ps aux | grep -i "$pattern" | grep -v grep | awk '{print $2}' || true)

    if [ -n "$pids" ]; then
        echo -e "${YELLOW}📦 Found $description processes: $pids${NC}"
        for pid in $pids; do
            echo -e "${RED}🔪 Killing $description process $pid${NC}"
            kill -TERM "$pid" 2>/dev/null || true
            sleep 0.5
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${RED}💀 Force killing $description process $pid${NC}"
                kill -KILL "$pid" 2>/dev/null || true
            fi
        done
    else
        echo -e "${GREEN}✅ No $description processes found${NC}"
    fi
}

echo -e "${BLUE}🎯 Killing Electron processes...${NC}"

# Kill by specific app name
kill_by_name "$APP_NAME"
kill_by_name "$PRODUCT_NAME"

# Kill by common Electron patterns
kill_by_pattern "electron.*itracksy" "Electron itracksy"
kill_by_pattern "\.vite/build/main\.js" "Vite main process"
kill_by_pattern "electron-forge start" "Electron Forge"

# Kill any remaining Electron processes that might be related
# (be more careful with this one to avoid killing other Electron apps)
kill_by_pattern "electron.*\.vite" "Electron Vite"

# Kill Node.js processes that might be related to the build
kill_by_pattern "node.*electron-forge" "Node Electron Forge"
kill_by_pattern "node.*vite.*electron" "Node Vite Electron"

# Special handling for development server processes
kill_by_pattern "vite.*electron" "Vite Electron dev server"

echo -e "${BLUE}🧹 Cleaning up any remaining zombie processes...${NC}"

# Clear Vite dependency optimization cache to fix 504 errors
echo -e "${BLUE}🗑️  Clearing Vite dependency optimization cache...${NC}"
if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite
    echo -e "${GREEN}✅ Vite cache cleared${NC}"
else
    echo -e "${YELLOW}ℹ️  No Vite cache found to clear${NC}"
fi

# Clear any other potential cache directories
echo -e "${BLUE}🧽 Clearing additional cache directories...${NC}"
if [ -d ".vite" ]; then
    rm -rf .vite
    echo -e "${GREEN}✅ .vite directory cleared${NC}"
fi

if [ -d "dist-electron" ]; then
    rm -rf dist-electron
    echo -e "${GREEN}✅ dist-electron directory cleared${NC}"
fi

# Wait a moment for processes to fully terminate
sleep 2

# Final check for any remaining processes
remaining_processes=$(pgrep -f "$APP_NAME" 2>/dev/null || true)
if [ -n "$remaining_processes" ]; then
    echo -e "${YELLOW}⚠️  Some processes may still be running: $remaining_processes${NC}"
    echo -e "${YELLOW}💡 You may need to manually kill them or restart your system${NC}"
else
    echo -e "${GREEN}✅ All Electron processes for $APP_NAME have been terminated${NC}"
fi

# Start the app if requested
if [ "$START_APP" = true ]; then
    echo -e "${BLUE}🚀 Starting the application...${NC}"
    echo -e "${YELLOW}📁 Current directory: $(pwd)${NC}"

    # Navigate to the project root if not already there
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

    if [ "$(pwd)" != "$PROJECT_ROOT" ]; then
        echo -e "${BLUE}� Changing to project directory: $PROJECT_ROOT${NC}"
        cd "$PROJECT_ROOT"
    fi

    echo -e "${GREEN}🎯 Running: npm run dev${NC}"
    npm run dev
else
    echo -e "${BLUE}�🚀 Ready to start fresh! You can now run 'npm run dev' or 'npm start'${NC}"
    echo -e "${YELLOW}💡 Tip: Use './scripts/kill-electron.sh --start' to automatically start the app after killing processes${NC}"
fi
