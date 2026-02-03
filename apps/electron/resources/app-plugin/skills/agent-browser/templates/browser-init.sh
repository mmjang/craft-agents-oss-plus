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
AGENT_BROWSER_CDP_PORT="${AGENT_BROWSER_CDP_PORT:-9444}"
CHROME_PROFILE="${CHROME_PROFILE:-$HOME/.craft-agent-profile}"

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin)  echo "macos" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        Linux)   echo "linux" ;;
        *)       echo "unknown" ;;
    esac
}

OS_TYPE=$(detect_os)

# Check if CDP port is available
check_cdp() {
    curl -s "http://localhost:${AGENT_BROWSER_CDP_PORT}/json/version" > /dev/null 2>&1
}

# Find Chrome executable based on OS
find_chrome() {
    case "$OS_TYPE" in
        macos)
            local candidates=(
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
                "/Applications/Chromium.app/Contents/MacOS/Chromium"
                "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
            )
            ;;
        windows)
            local candidates=(
                "/c/Program Files/Microsoft/Edge/Application/msedge.exe"
                "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
                "$LOCALAPPDATA/Microsoft/Edge/Application/msedge.exe"
                "$PROGRAMFILES/Microsoft/Edge/Application/msedge.exe"
                "/c/Program Files/Google/Chrome/Application/chrome.exe"
                "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
                "$LOCALAPPDATA/Google/Chrome/Application/chrome.exe"
                "$PROGRAMFILES/Google/Chrome/Application/chrome.exe"
            )
            ;;
        linux)
            local candidates=(
                "/usr/bin/google-chrome"
                "/usr/bin/google-chrome-stable"
                "/usr/bin/chromium"
                "/usr/bin/chromium-browser"
                "/snap/bin/chromium"
            )
            ;;
        *)
            return 1
            ;;
    esac

    for chrome in "${candidates[@]}"; do
        # Expand environment variables for Windows paths (safely preserve spaces/parentheses)
        local expanded_chrome="$chrome"
        if [[ "$chrome" == *'$'* ]]; then
            expanded_chrome=$(eval "echo \"$chrome\"")
        fi
        if [ -x "$expanded_chrome" ] || [ -f "$expanded_chrome" ]; then
            echo "$expanded_chrome"
            return 0
        fi
    done
    return 1
}

# Step 1: Install agent-browser if not found
if ! command -v agent-browser &> /dev/null; then
    echo "Installing agent-browser..."
    npm install -g agent-browser
fi

# Step 2: Check if CDP is already available
if check_cdp; then
    echo "CDP port ${AGENT_BROWSER_CDP_PORT} is already available."
    echo "Connecting agent-browser..."
    agent-browser connect "${AGENT_BROWSER_CDP_PORT}"
    echo ""
    echo "Ready to use:"
    echo "  agent-browser open <url>"
    echo "  agent-browser snapshot -i"
    exit 0
fi


# Step 3: Find Chrome or install Chromium
CHROME_PATH=$(find_chrome || true)

if [ -z "$CHROME_PATH" ]; then
    echo "Chrome not found. Installing Chromium via agent-browser..."
    agent-browser install

    # Find the installed Chromium path
    CHROMIUM_PATH=$(agent-browser eval "require('playwright').chromium.executablePath()" 2>/dev/null || true)
    if [ -n "$CHROMIUM_PATH" ] && [ -f "$CHROMIUM_PATH" ]; then
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
echo "Starting Chrome with CDP on port ${AGENT_BROWSER_CDP_PORT}..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_PAGE="file://${SCRIPT_DIR}/agent-browser-home.html"

"$CHROME_PATH" \
    --remote-debugging-port="${AGENT_BROWSER_CDP_PORT}" \
    --user-data-dir="${CHROME_PROFILE}" \
    --no-first-run \
    --no-default-browser-check \
    "$HOME_PAGE" \
    > /dev/null 2>&1 &

# Wait for CDP to become available
echo "Waiting for Chrome to start..."
agent-browser close 2>/dev/null || true
for i in $(seq 1 30); do
    if check_cdp; then
        echo "Chrome started successfully."
        echo "Connecting agent-browser..."
        agent-browser connect "${AGENT_BROWSER_CDP_PORT}"
        echo ""
        echo "Ready to use:"
        echo "  agent-browser open <url>"
        echo "  agent-browser snapshot -i"
        exit 0
    fi
    sleep 1
done

echo "ERROR: Chrome failed to start with CDP on port ${AGENT_BROWSER_CDP_PORT}."
exit 1
