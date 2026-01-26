#!/bin/bash
# Download portable runtime for the current platform or specified target
#
# Usage:
#   ./scripts/download-portable-runtime.sh          # Auto-detect platform
#   ./scripts/download-portable-runtime.sh darwin   # Download for macOS
#   ./scripts/download-portable-runtime.sh win      # Download for Windows
#   ./scripts/download-portable-runtime.sh all      # Download for all platforms

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

download_darwin() {
  echo -e "${GREEN}Downloading portable runtime for macOS...${NC}"
  "$SCRIPT_DIR/download-portable-darwin.sh"
}

download_win() {
  echo -e "${GREEN}Downloading portable runtime for Windows...${NC}"
  "$SCRIPT_DIR/download-portable-win.sh"
}

# Parse argument or auto-detect
TARGET="${1:-auto}"

case "$TARGET" in
  darwin|mac|macos)
    download_darwin
    ;;
  win|windows)
    download_win
    ;;
  all)
    download_darwin
    echo ""
    download_win
    ;;
  auto)
    case "$(uname -s)" in
      Darwin)
        download_darwin
        ;;
      MINGW*|MSYS*|CYGWIN*)
        download_win
        ;;
      Linux)
        echo -e "${YELLOW}Linux portable runtime not yet implemented.${NC}"
        echo "For now, Linux users are expected to have Python and Node.js installed."
        exit 0
        ;;
      *)
        echo "Unknown platform: $(uname -s)"
        echo "Usage: $0 [darwin|win|all]"
        exit 1
        ;;
    esac
    ;;
  *)
    echo "Unknown target: $TARGET"
    echo "Usage: $0 [darwin|win|all]"
    exit 1
    ;;
esac
