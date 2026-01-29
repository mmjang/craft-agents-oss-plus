#!/bin/bash
# browser-init.sh - Prepare Chrome with CDP port and connect agent-browser
# Usage: ./browser-init.sh
#
# This script:
# 1. Checks if CDP port is already available
# 2. Installs agent-browser if not found
# 3. Finds local Chrome or installs Chromium via agent-browser
# 4. Launches Chrome with CDP enabled
# 5. Connects agent-browser to CDP port
#
# After running this script, use:
#   agent-browser open <url>
#   agent-browser snapshot -i

set -e

# Configuration
CDP_PORT="${CDP_PORT:-9222}"
CHROME_PROFILE="${CHROME_PROFILE:-$HOME/.craft-agent-profile}"

# Check if CDP port is available
check_cdp() {
    curl -s "http://localhost:${CDP_PORT}/json/version" > /dev/null 2>&1
}

# Find Chrome executable (macOS)
find_chrome() {
    local candidates=(
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        "/Applications/Chromium.app/Contents/MacOS/Chromium"
        "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
    )
    for chrome in "${candidates[@]}"; do
        if [ -x "$chrome" ]; then
            echo "$chrome"
            return 0
        fi
    done
    return 1
}

# Step 1: Check if CDP is already available
if check_cdp; then
    echo "CDP port ${CDP_PORT} is already available."
    echo "Connecting agent-browser..."
    agent-browser connect "${CDP_PORT}"
    echo ""
    echo "Ready to use:"
    echo "  agent-browser open <url>"
    echo "  agent-browser snapshot -i"
    exit 0
fi

# Step 2: Install agent-browser if not found
if ! command -v agent-browser &> /dev/null; then
    echo "Installing agent-browser..."
    npm install -g agent-browser
fi

# Step 3: Find Chrome or install Chromium
CHROME_PATH=$(find_chrome || true)

if [ -z "$CHROME_PATH" ]; then
    echo "Chrome not found. Installing Chromium via agent-browser..."
    agent-browser install

    # Find the installed Chromium path
    CHROMIUM_PATH=$(agent-browser eval "require('playwright').chromium.executablePath()" 2>/dev/null || true)
    if [ -n "$CHROMIUM_PATH" ] && [ -x "$CHROMIUM_PATH" ]; then
        CHROME_PATH="$CHROMIUM_PATH"
    else
        echo "ERROR: Failed to find Chromium after installation."
        echo "Please install Google Chrome manually."
        exit 1
    fi
fi

echo "Using browser: $CHROME_PATH"
echo "Profile: $CHROME_PROFILE"

# Step 4: Launch Chrome with CDP
echo "Starting Chrome with CDP on port ${CDP_PORT}..."

"$CHROME_PATH" \
    --remote-debugging-port="${CDP_PORT}" \
    --user-data-dir="${CHROME_PROFILE}" \
    --no-first-run \
    --no-default-browser-check \
    > /dev/null 2>&1 &

# Wait for CDP to become available
echo "Waiting for Chrome to start..."
for i in {1..30}; do
    if check_cdp; then
        echo "Chrome started successfully."
        echo "Connecting agent-browser..."
        agent-browser connect "${CDP_PORT}"
        echo ""
        echo "Ready to use:"
        echo "  agent-browser open <url>"
        echo "  agent-browser snapshot -i"
        exit 0
    fi
    sleep 0.5
done

echo "ERROR: Chrome failed to start with CDP on port ${CDP_PORT}."
exit 1
