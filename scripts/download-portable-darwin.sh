#!/bin/bash
# Download portable runtime for macOS (Apple Silicon)
# This script downloads Python and Node.js for bundling with the Electron app

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PORTABLE_DIR="$PROJECT_ROOT/apps/electron/resources/portable-darwin"

# Versions
PYTHON_VERSION="3.11.11"
PYTHON_RELEASE="20250115"
NODE_VERSION="22.22.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Downloading Portable Runtime for macOS (Apple Silicon) ===${NC}"
echo "Target directory: $PORTABLE_DIR"
echo ""

# Create directory
mkdir -p "$PORTABLE_DIR"

# ========== Download Python Standalone ==========
echo -e "${YELLOW}[1/2] Downloading Python ${PYTHON_VERSION}...${NC}"

PYTHON_URL="https://github.com/indygreg/python-build-standalone/releases/download/${PYTHON_RELEASE}/cpython-${PYTHON_VERSION}+${PYTHON_RELEASE}-aarch64-apple-darwin-install_only.tar.gz"
PYTHON_TAR="/tmp/python-standalone.tar.gz"

echo "URL: $PYTHON_URL"

if [ -d "$PORTABLE_DIR/python" ]; then
  echo "Python directory already exists, removing..."
  rm -rf "$PORTABLE_DIR/python"
fi

curl -L -o "$PYTHON_TAR" "$PYTHON_URL"
mkdir -p "$PORTABLE_DIR/python"
tar -xzf "$PYTHON_TAR" -C "$PORTABLE_DIR/python" --strip-components=1

# Ensure pip is available
echo "Ensuring pip is available..."
"$PORTABLE_DIR/python/bin/python3" -m ensurepip --upgrade 2>/dev/null || true

# Create pip.conf for Chinese mirror
echo "Configuring pip mirror..."
mkdir -p "$PORTABLE_DIR/python/pip"
cat > "$PORTABLE_DIR/python/pip/pip.conf" << 'EOF'
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
trusted-host = pypi.tuna.tsinghua.edu.cn

[install]
trusted-host = pypi.tuna.tsinghua.edu.cn
EOF

# Clean up
rm -f "$PYTHON_TAR"

echo -e "${GREEN}Python ${PYTHON_VERSION} downloaded successfully!${NC}"
echo ""

# ========== Download Node.js ==========
echo -e "${YELLOW}[2/2] Downloading Node.js ${NODE_VERSION}...${NC}"

NODE_URL="https://npmmirror.com/mirrors/node/v${NODE_VERSION}/node-v${NODE_VERSION}-darwin-arm64.tar.gz"
NODE_TAR="/tmp/node.tar.gz"

echo "URL: $NODE_URL"

if [ -d "$PORTABLE_DIR/node" ]; then
  echo "Node directory already exists, removing..."
  rm -rf "$PORTABLE_DIR/node"
fi

curl -L -o "$NODE_TAR" "$NODE_URL"
mkdir -p "$PORTABLE_DIR/node"
tar -xzf "$NODE_TAR" -C "$PORTABLE_DIR/node" --strip-components=1

# Create .npmrc for Chinese mirror
echo "Configuring npm mirror..."
cat > "$PORTABLE_DIR/node/.npmrc" << 'EOF'
registry=https://registry.npmmirror.com
disturl=https://npmmirror.com/dist
electron_mirror=https://npmmirror.com/mirrors/electron/
sass_binary_site=https://npmmirror.com/mirrors/node-sass/
phantomjs_cdnurl=https://npmmirror.com/mirrors/phantomjs/
EOF

# Clean up
rm -f "$NODE_TAR"

echo -e "${GREEN}Node.js ${NODE_VERSION} downloaded successfully!${NC}"
echo ""

# ========== Summary ==========
echo -e "${GREEN}=== Download Complete ===${NC}"
echo ""
echo "Directory structure:"
ls -la "$PORTABLE_DIR"
echo ""
echo "Python version:"
"$PORTABLE_DIR/python/bin/python3" --version
echo ""
echo "Node.js version:"
"$PORTABLE_DIR/node/bin/node" --version
echo ""
echo "npm version:"
"$PORTABLE_DIR/node/bin/npm" --version
echo ""
echo "Total size:"
du -sh "$PORTABLE_DIR"
echo ""
echo -e "${GREEN}Done! Portable runtime is ready at: $PORTABLE_DIR${NC}"
