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

# Calculate the expected TCP port for a session (must match daemon.js logic)
# Uses node to ensure exact match with daemon.js getPortForSession()
get_session_port() {
    local session="${1:-default}"
    node -e "
        function getPortForSession(session) {
            let hash = 0;
            for (let i = 0; i < session.length; i++) {
                hash = (hash << 5) - hash + session.charCodeAt(i);
                hash |= 0;
            }
            return 49152 + (Math.abs(hash) % 16383);
        }
        console.log(getPortForSession('$session'));
    "
}

# Check if a process is running by PID
is_process_running() {
    local pid="$1"
    if [ -z "$pid" ]; then
        return 1
    fi
    if [ "$OS_TYPE" = "windows" ]; then
        tasklist //FI "PID eq $pid" 2>/dev/null | grep -q "$pid"
    else
        kill -0 "$pid" 2>/dev/null
    fi
}

# Kill a process by PID
kill_process() {
    local pid="$1"
    if [ -z "$pid" ]; then
        return 1
    fi
    if [ "$OS_TYPE" = "windows" ]; then
        taskkill //F //PID "$pid" > /dev/null 2>&1
    else
        kill -9 "$pid" 2>/dev/null
    fi
}

# Clean up stale daemon files and processes
cleanup_stale_daemon() {
    local session="${1:-default}"
    local pid_file="$HOME/.agent-browser/${session}.pid"
    local port_file="$HOME/.agent-browser/${session}.port"

    # Check if PID file exists
    if [ -f "$pid_file" ]; then
        local old_pid=$(cat "$pid_file" 2>/dev/null)
        if [ -n "$old_pid" ]; then
            if is_process_running "$old_pid"; then
                echo "[DEBUG] Found running daemon process (PID: $old_pid), killing it..."
                kill_process "$old_pid"
                sleep 1
            fi
        fi
        rm -f "$pid_file" 2>/dev/null
    fi

    # Clean up port file
    rm -f "$port_file" 2>/dev/null

    # On Windows, also check if something else is using the expected port
    if [ "$OS_TYPE" = "windows" ]; then
        local expected_port=$(get_session_port "$session")
        local port_pid=$(netstat -ano 2>/dev/null | grep "127.0.0.1:$expected_port" | grep "LISTENING" | awk '{print $5}' | head -1)
        if [ -n "$port_pid" ] && [ "$port_pid" != "0" ]; then
            echo "[DEBUG] Port $expected_port is in use by PID $port_pid, killing it..."
            kill_process "$port_pid"
            sleep 1
        fi
    fi
}

# Check if daemon is responding on TCP port
check_daemon_tcp() {
    local port="$1"
    if [ -z "$port" ]; then
        return 1
    fi
    # Try to connect to the TCP port - daemon rejects HTTP so we just check if port is open
    if [ "$OS_TYPE" = "windows" ]; then
        # Use PowerShell to test TCP connection on Windows
        powershell -Command "try { \$c = New-Object System.Net.Sockets.TcpClient('127.0.0.1', $port); \$c.Close(); exit 0 } catch { exit 1 }" 2>/dev/null
    else
        # Use nc or bash /dev/tcp on Unix
        (echo > /dev/tcp/127.0.0.1/$port) 2>/dev/null
    fi
}

# Ensure agent-browser daemon is running (Windows fix)
ensure_daemon() {
    local session="${1:-default}"
    echo "[DEBUG] Checking daemon status for session: $session"

    local pid_file="$HOME/.agent-browser/${session}.pid"
    local port_file="$HOME/.agent-browser/${session}.port"
    local expected_port=$(get_session_port "$session")

    echo "[DEBUG] Expected TCP port for session '$session': $expected_port"

    # Check if PID file exists and process is running
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null)
        echo "[DEBUG] Found PID file with PID: $pid"

        if is_process_running "$pid"; then
            # Process is running, verify it's responding on the expected port
            if check_daemon_tcp "$expected_port"; then
                echo "[DEBUG] Daemon is running (PID: $pid) and responding on port $expected_port"
                return 0
            else
                echo "[DEBUG] Daemon process exists but not responding on port $expected_port"
                echo "[DEBUG] Cleaning up stale daemon..."
                cleanup_stale_daemon "$session"
            fi
        else
            echo "[DEBUG] PID file exists but process $pid is not running"
            echo "[DEBUG] Cleaning up stale files..."
            rm -f "$pid_file" "$port_file" 2>/dev/null
        fi
    else
        echo "[DEBUG] No PID file found at $pid_file"
        # Check if port is in use by something else (stale process without PID file)
        if check_daemon_tcp "$expected_port"; then
            echo "[DEBUG] Port $expected_port is in use but no PID file - cleaning up..."
            cleanup_stale_daemon "$session"
        fi
    fi

    # Daemon not running - start it manually (especially needed on Windows)
    if [ "$OS_TYPE" = "windows" ]; then
        echo "[DEBUG] OS is Windows, starting daemon manually..."

        # Find daemon.js location
        local daemon_js=""
        local agent_browser_path=$(which agent-browser 2>/dev/null || true)

        if [ -n "$agent_browser_path" ]; then
            echo "[DEBUG] Found agent-browser at: $agent_browser_path"

            # Resolve symlink and find node_modules
            local base_dir=$(dirname "$agent_browser_path")
            echo "[DEBUG] Base directory: $base_dir"

            local candidates=(
                "$base_dir/node_modules/agent-browser/dist/daemon.js"
                "$base_dir/../lib/node_modules/agent-browser/dist/daemon.js"
            )

            for candidate in "${candidates[@]}"; do
                echo "[DEBUG] Checking candidate: $candidate"
                if [ -f "$candidate" ]; then
                    daemon_js="$candidate"
                    echo "[DEBUG] Found daemon.js at: $daemon_js"
                    break
                fi
            done
        else
            echo "[DEBUG] agent-browser command not found in PATH"
        fi

        if [ -n "$daemon_js" ] && [ -f "$daemon_js" ]; then
            echo "Starting agent-browser daemon..."

            # Create log file for daemon output
            local log_file="$HOME/.agent-browser/daemon.log"
            echo "[DEBUG] Daemon log file: $log_file"

            # Start daemon with output captured to log file
            echo "[DEBUG] Executing: node \"$daemon_js\""
            node "$daemon_js" > "$log_file" 2>&1 &
            local daemon_pid=$!
            echo "[DEBUG] Daemon started with PID: $daemon_pid"

            # Wait for daemon to initialize (check TCP port)
            echo "[DEBUG] Waiting for daemon to initialize on port $expected_port..."
            local max_wait=10
            local waited=0
            while [ $waited -lt $max_wait ]; do
                sleep 1
                waited=$((waited + 1))

                # Check if process is still running
                if ! is_process_running "$daemon_pid"; then
                    echo "[DEBUG] ERROR: Daemon process exited unexpectedly"
                    echo "[DEBUG] Daemon log output:"
                    cat "$log_file" 2>/dev/null || echo "(no log output)"
                    return 1
                fi

                # Check if daemon is responding
                if check_daemon_tcp "$expected_port"; then
                    echo "[DEBUG] Daemon initialized successfully on port $expected_port (waited ${waited}s)"
                    return 0
                fi

                echo "[DEBUG] Waiting... ($waited/$max_wait)"
            done

            echo "[DEBUG] WARNING: Daemon started but not responding after ${max_wait}s"
            echo "[DEBUG] Daemon log output:"
            cat "$log_file" 2>/dev/null || echo "(no log output)"
        else
            echo "[DEBUG] ERROR: Could not find daemon.js file"
            echo "[DEBUG] Searched locations:"
            echo "[DEBUG]   - $base_dir/node_modules/agent-browser/dist/daemon.js"
            echo "[DEBUG]   - $base_dir/../lib/node_modules/agent-browser/dist/daemon.js"
            return 1
        fi
    else
        echo "[DEBUG] OS is not Windows ($OS_TYPE), skipping manual daemon start"
    fi
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
    ensure_daemon
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
if [ "$OS_TYPE" = "windows" ] && command -v cygpath >/dev/null 2>&1; then
    # Convert to Windows path and encode spaces for a valid file URI.
    SCRIPT_DIR_WIN="$(cygpath -m "$SCRIPT_DIR")"
    SCRIPT_DIR_WIN="${SCRIPT_DIR_WIN// /%20}"
    HOME_PAGE="file:///${SCRIPT_DIR_WIN}/agent-browser-home.html"
else
    HOME_PAGE="file://${SCRIPT_DIR}/agent-browser-home.html"
fi

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
        ensure_daemon
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
