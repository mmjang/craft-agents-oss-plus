#!/bin/bash
# Download portable runtime for Windows (x64)
# This script downloads Git Bash, Python, and Node.js for bundling with the Electron app
#
# Note: This script is designed to run on macOS/Linux (cross-compilation)
# or on Windows with Git Bash/WSL installed.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PORTABLE_DIR="$PROJECT_ROOT/apps/electron/resources/portable-win"

# Versions
GIT_VERSION="2.47.1"
PYTHON_VERSION="3.11.9"
NODE_VERSION="20.18.2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PORTABLE_RUNTIME_SOURCE="${PORTABLE_RUNTIME_SOURCE:-mirror}" # mirror | official

find_7z() {
  if command -v 7z &> /dev/null; then
    echo "7z"
    return 0
  fi
  if command -v 7zz &> /dev/null; then
    echo "7zz"
    return 0
  fi
  return 1
}

download_with_fallback() {
  local primary_url="$1"
  local fallback_url="$2"
  local output_path="$3"

  if curl -fL -o "$output_path" "$primary_url"; then
    return 0
  fi

  echo -e "${YELLOW}Primary download failed, retrying with fallback...${NC}"
  curl -fL -o "$output_path" "$fallback_url"
}

extract_zip() {
  local zip_path="$1"
  local dest_dir="$2"
  local sevenzip

  sevenzip="$(find_7z || true)"
  if [ -n "$sevenzip" ]; then
    "$sevenzip" x "$zip_path" -o"$dest_dir" -y
    return 0
  fi

  if command -v unzip &> /dev/null; then
    unzip -q "$zip_path" -d "$dest_dir"
    return 0
  fi

  echo -e "${RED}Error: Neither 7z nor unzip is available to extract $zip_path${NC}"
  exit 1
}

echo -e "${GREEN}=== Downloading Portable Runtime for Windows (x64) ===${NC}"
echo "Target directory: $PORTABLE_DIR"
echo ""

# Create directory
mkdir -p "$PORTABLE_DIR"

# ========== Download Git for Windows Portable ==========
echo -e "${YELLOW}[1/3] Downloading Git for Windows Portable ${GIT_VERSION}...${NC}"

# Git for Windows uses a different version format in the URL
GIT_URL_MIRROR="https://npmmirror.com/mirrors/git-for-windows/v${GIT_VERSION}.windows.1/PortableGit-${GIT_VERSION}-64-bit.7z.exe"
GIT_URL_OFFICIAL="https://github.com/git-for-windows/git/releases/download/v${GIT_VERSION}.windows.1/PortableGit-${GIT_VERSION}-64-bit.7z.exe"
GIT_ARCHIVE="/tmp/git-portable.7z.exe"

if [ "$PORTABLE_RUNTIME_SOURCE" = "official" ]; then
  GIT_PRIMARY="$GIT_URL_OFFICIAL"
  GIT_FALLBACK="$GIT_URL_MIRROR"
else
  GIT_PRIMARY="$GIT_URL_MIRROR"
  GIT_FALLBACK="$GIT_URL_OFFICIAL"
fi

echo "Primary URL: $GIT_PRIMARY"

if [ -d "$PORTABLE_DIR/git" ]; then
  echo "Git directory already exists, removing..."
  rm -rf "$PORTABLE_DIR/git"
fi

download_with_fallback "$GIT_PRIMARY" "$GIT_FALLBACK" "$GIT_ARCHIVE"

# Extract using 7z (works on macOS with `brew install p7zip`)
# The .7z.exe is a self-extracting archive that 7z can handle
if sevenzip="$(find_7z)"; then
  "$sevenzip" x "$GIT_ARCHIVE" -o"$PORTABLE_DIR/git" -y
else
  echo -e "${RED}Error: 7z not found. Please install p7zip:${NC}"
  echo "  macOS: brew install p7zip"
  echo "  Ubuntu: sudo apt install p7zip-full"
  exit 1
fi

# Clean up
rm -f "$GIT_ARCHIVE"

echo -e "${GREEN}Git for Windows ${GIT_VERSION} downloaded successfully!${NC}"
echo ""

# ========== Download Python Embeddable ==========
echo -e "${YELLOW}[2/3] Downloading Python Embeddable ${PYTHON_VERSION}...${NC}"

PYTHON_URL="https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip"
PYTHON_ZIP="/tmp/python-embed.zip"

echo "URL: $PYTHON_URL"

if [ -d "$PORTABLE_DIR/python" ]; then
  echo "Python directory already exists, removing..."
  rm -rf "$PORTABLE_DIR/python"
fi

curl -fL -o "$PYTHON_ZIP" "$PYTHON_URL"
mkdir -p "$PORTABLE_DIR/python"
extract_zip "$PYTHON_ZIP" "$PORTABLE_DIR/python"

# Download get-pip.py
echo "Downloading get-pip.py..."
curl -fL -o "$PORTABLE_DIR/python/get-pip.py" "https://bootstrap.pypa.io/get-pip.py"

# Modify python311._pth to enable site-packages
# This is required for pip to work properly
echo "Configuring Python path..."
cat > "$PORTABLE_DIR/python/python311._pth" << 'EOF'
python311.zip
.
Lib/site-packages
import site
EOF

# Create pip.ini for Chinese mirror
echo "Configuring pip mirror..."
mkdir -p "$PORTABLE_DIR/python/pip"
cat > "$PORTABLE_DIR/python/pip/pip.ini" << 'EOF'
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
trusted-host = pypi.tuna.tsinghua.edu.cn

[install]
trusted-host = pypi.tuna.tsinghua.edu.cn
EOF

# Clean up
rm -f "$PYTHON_ZIP"

echo -e "${GREEN}Python ${PYTHON_VERSION} downloaded successfully!${NC}"
echo ""
echo -e "${YELLOW}Note: pip will be pre-installed during CI build.${NC}"
echo -e "${YELLOW}For local builds, run: python.exe get-pip.py -i https://pypi.tuna.tsinghua.edu.cn/simple${NC}"
echo ""

# ========== Download Node.js ==========
echo -e "${YELLOW}[3/3] Downloading Node.js ${NODE_VERSION}...${NC}"

NODE_URL_MIRROR="https://npmmirror.com/mirrors/node/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
NODE_URL_OFFICIAL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
NODE_ZIP="/tmp/node-win.zip"

if [ "$PORTABLE_RUNTIME_SOURCE" = "official" ]; then
  NODE_PRIMARY="$NODE_URL_OFFICIAL"
  NODE_FALLBACK="$NODE_URL_MIRROR"
else
  NODE_PRIMARY="$NODE_URL_MIRROR"
  NODE_FALLBACK="$NODE_URL_OFFICIAL"
fi

echo "Primary URL: $NODE_PRIMARY"

if [ -d "$PORTABLE_DIR/node" ]; then
  echo "Node directory already exists, removing..."
  rm -rf "$PORTABLE_DIR/node"
fi

download_with_fallback "$NODE_PRIMARY" "$NODE_FALLBACK" "$NODE_ZIP"
mkdir -p "/tmp/node-extract"
extract_zip "$NODE_ZIP" "/tmp/node-extract"
mv "/tmp/node-extract/node-v${NODE_VERSION}-win-x64" "$PORTABLE_DIR/node"

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
rm -f "$NODE_ZIP"
rm -rf "/tmp/node-extract"

echo -e "${GREEN}Node.js ${NODE_VERSION} downloaded successfully!${NC}"
echo ""

# ========== Summary ==========
echo -e "${GREEN}=== Download Complete ===${NC}"
echo ""
echo "Directory structure:"
ls -la "$PORTABLE_DIR"
echo ""
echo "Git Bash:"
ls -la "$PORTABLE_DIR/git/bin/bash.exe" 2>/dev/null || echo "  (bash.exe location may vary)"
echo ""
echo "Python:"
ls -la "$PORTABLE_DIR/python/python.exe" 2>/dev/null || echo "  python.exe ready"
echo ""
echo "Node.js:"
ls -la "$PORTABLE_DIR/node/node.exe" 2>/dev/null || echo "  node.exe ready"
echo ""
echo "Total size:"
du -sh "$PORTABLE_DIR"
echo ""
echo -e "${GREEN}Done! Windows portable runtime is ready at: $PORTABLE_DIR${NC}"
echo ""
echo -e "${YELLOW}Important: On first run on Windows, install pip by running:${NC}"
echo "  cd $PORTABLE_DIR/python"
echo "  python.exe get-pip.py"
