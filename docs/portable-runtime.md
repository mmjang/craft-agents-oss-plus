# 便携式运行时打包方案

## 背景

Craft Agents 的目标用户包括非技术背景的普通白领员工。这些用户通常没有安装开发环境（Python、Node.js 等）。为了让 AI Agent 能够正常执行自动化脚本，我们需要在应用中打包必要的运行时环境。

### 核心问题

1. **脚本执行需要运行时**：Agent 经常需要编写并执行 Python 或 JavaScript 脚本
2. **网络访问问题**：中国大陆用户访问 npm、PyPI 官方源速度慢或无法访问
3. **Windows 特殊要求**：Claude Agent SDK 在 Windows 上强制要求 Git Bash

### 平台差异

| 平台 | Shell | Python | Node.js |
|------|-------|--------|---------|
| Windows | 需要打包 Git Bash | 需要打包 | 需要打包 |
| macOS | 系统自带 bash/zsh | 需要打包（12.3+不再预装） | 需要打包 |
| Linux | 系统自带 bash | 通常已安装 | 需要打包 |

---

## 打包方案总览

### Windows

| 运行时 | 必要性 | 压缩后体积 | 用途 |
|--------|--------|-----------|------|
| Git for Windows Portable | **必须** | ~50MB | Bash shell、Git、常用 Unix 工具 |
| Python Embeddable | **推荐** | ~15MB | Python 脚本执行、数据处理 |
| Node.js | **推荐** | ~30MB | JavaScript 脚本、npm 包管理 |
| **总计** | | **~95MB** | |

### macOS

| 运行时 | 必要性 | 压缩后体积 | 用途 |
|--------|--------|-----------|------|
| Python Standalone | **推荐** | ~25MB | Python 脚本执行、数据处理 |
| Node.js | **推荐** | ~25MB | JavaScript 脚本、npm 包管理 |
| **总计** | | **~50MB** | |

> **注意**：macOS 自带 bash/zsh，不需要打包 shell。

---

## 目录结构

### Windows 目录结构

```
apps/electron/resources/
├── portable-win/
│   ├── git/                           # Git for Windows Portable (~300MB 解压后)
│   │   ├── bin/
│   │   │   ├── bash.exe              # Git Bash (SDK 必需)
│   │   │   ├── git.exe
│   │   │   └── ...
│   │   └── usr/bin/
│   │       ├── curl.exe
│   │       ├── grep.exe
│   │       └── ...
│   │
│   ├── python/                        # Python Embeddable (~40MB 解压后)
│   │   ├── python.exe
│   │   ├── python311.dll
│   │   ├── python311._pth
│   │   └── Scripts/
│   │       └── pip.exe
│   │
│   └── node/                          # Node.js (~70MB 解压后)
│       ├── node.exe
│       ├── npm.cmd
│       ├── npx.cmd
│       └── node_modules/npm/
```

### macOS 目录结构

```
apps/electron/resources/
├── portable-darwin/
│   ├── python/                        # Python Standalone (~100MB 解压后)
│   │   ├── bin/
│   │   │   ├── python3
│   │   │   ├── python3.11
│   │   │   └── pip3
│   │   └── lib/
│   │       └── python3.11/
│   │
│   └── node/                          # Node.js (~80MB 解压后)
│       ├── bin/
│       │   ├── node
│       │   ├── npm
│       │   └── npx
│       └── lib/
│           └── node_modules/npm/
```

---

## Windows 实现细节

### 1. Git for Windows Portable

Claude Agent SDK 在 Windows 上**强制要求 Git Bash**，不支持 PowerShell 或 cmd.exe。

#### 下载地址
- 官方：https://git-scm.com/download/win → "64-bit Git for Windows Portable"
- 镜像：https://npmmirror.com/mirrors/git-for-windows/

#### 包含的工具
- `bash.exe` - Bash shell（SDK 必需）
- `git.exe` - Git 版本控制
- `curl.exe`, `grep.exe`, `sed.exe`, `awk.exe` - 常用工具

### 2. Python Embeddable (Windows)

#### 下载地址
- 官方：https://www.python.org/downloads/windows/ → "Windows embeddable package (64-bit)"
- 推荐版本：Python 3.11.x

#### 配置步骤

1. **启用 pip**：
```bash
curl -o get-pip.py https://bootstrap.pypa.io/get-pip.py
python.exe get-pip.py
```

2. **修改 `python311._pth`**：
```
python311.zip
.
Lib/site-packages
import site
```

### 3. Node.js (Windows)

#### 下载地址
- 官方：https://nodejs.org/dist/ → `node-vXX.XX.X-win-x64.zip`
- 镜像：https://npmmirror.com/mirrors/node/
- 推荐版本：Node.js 20.x LTS

---

## macOS 实现细节

### 1. Python Standalone (macOS)

macOS 12.3 (Monterey) 之后不再预装 Python，需要打包。

#### 推荐方案：python-build-standalone

[python-build-standalone](https://github.com/indygreg/python-build-standalone) 项目提供预编译的独立 Python，无需系统依赖。

#### 下载地址
```
https://github.com/indygreg/python-build-standalone/releases
```

选择文件：
- Intel Mac: `cpython-3.11.x+YYYYMMDD-x86_64-apple-darwin-install_only.tar.gz`
- Apple Silicon: `cpython-3.11.x+YYYYMMDD-aarch64-apple-darwin-install_only.tar.gz`

#### 体积
- 压缩后：~25MB
- 解压后：~100MB

#### 目录结构
```
python/
├── bin/
│   ├── python3
│   ├── python3.11
│   ├── pip3
│   └── pip3.11
├── lib/
│   └── python3.11/
│       ├── site-packages/
│       └── ...
└── include/
```

### 2. Node.js (macOS)

#### 下载地址
- 官方：https://nodejs.org/dist/ → `node-vXX.XX.X-darwin-x64.tar.gz` 或 `node-vXX.XX.X-darwin-arm64.tar.gz`
- 镜像：https://npmmirror.com/mirrors/node/

#### 体积
- 压缩后：~25MB
- 解压后：~80MB

#### 目录结构
```
node/
├── bin/
│   ├── node
│   ├── npm -> ../lib/node_modules/npm/bin/npm-cli.js
│   └── npx -> ../lib/node_modules/npm/bin/npx-cli.js
└── lib/
    └── node_modules/
        └── npm/
```

---

## 中国大陆镜像源配置

### npm/yarn/pnpm 镜像

| 镜像 | URL |
|------|-----|
| 淘宝 NPM | https://registry.npmmirror.com |

### pip 镜像

| 镜像 | URL |
|------|-----|
| 清华大学 | https://pypi.tuna.tsinghua.edu.cn/simple |
| 阿里云 | https://mirrors.aliyun.com/pypi/simple |

### 配置方式（通过环境变量）

```typescript
// npm 镜像
process.env.npm_config_registry = 'https://registry.npmmirror.com';
process.env.YARN_REGISTRY = 'https://registry.npmmirror.com';

// pip 镜像
process.env.PIP_INDEX_URL = 'https://pypi.tuna.tsinghua.edu.cn/simple';
process.env.PIP_TRUSTED_HOST = 'pypi.tuna.tsinghua.edu.cn';

// 其他二进制文件镜像
process.env.ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/';
process.env.SASS_BINARY_SITE = 'https://npmmirror.com/mirrors/node-sass/';
process.env.PUPPETEER_DOWNLOAD_HOST = 'https://npmmirror.com/mirrors';
```

---

## 代码实现

### 跨平台初始化代码

```typescript
// apps/electron/src/main/portable-runtime.ts
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

interface MirrorConfig {
  npm: string;
  pip: string;
  pipTrustedHost: string;
}

const MIRROR_PRESETS: Record<string, MirrorConfig> = {
  china: {
    npm: 'https://registry.npmmirror.com',
    pip: 'https://pypi.tuna.tsinghua.edu.cn/simple',
    pipTrustedHost: 'pypi.tuna.tsinghua.edu.cn',
  },
  global: {
    npm: 'https://registry.npmjs.org',
    pip: 'https://pypi.org/simple',
    pipTrustedHost: 'pypi.org',
  },
};

export function setupPortableRuntime(mirrorPreset: string = 'china') {
  const resourcesPath = process.resourcesPath || path.join(app.getAppPath(), 'resources');
  const mirror = MIRROR_PRESETS[mirrorPreset] || MIRROR_PRESETS.china;
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  // 平台特定的便携式运行时目录
  const portablePath = path.join(
    resourcesPath,
    isWindows ? 'portable-win' : isMac ? 'portable-darwin' : 'portable-linux'
  );

  const pathSeparator = isWindows ? ';' : ':';

  // ========== Windows: Git Bash 配置 ==========
  if (isWindows) {
    const gitPath = path.join(portablePath, 'git');
    const bashExe = path.join(gitPath, 'bin', 'bash.exe');

    if (fs.existsSync(bashExe)) {
      process.env.CLAUDE_CODE_GIT_BASH_PATH = bashExe;
      process.env.PATH = [
        path.join(gitPath, 'bin'),
        path.join(gitPath, 'usr', 'bin'),
        process.env.PATH
      ].join(pathSeparator);
      console.log(`[Portable Runtime] Git Bash: ${bashExe}`);
    } else {
      console.warn('[Portable Runtime] Git Bash not found!');
    }
  }

  // ========== Python 配置 ==========
  const pythonPath = path.join(portablePath, 'python');
  const pythonBin = isWindows
    ? path.join(pythonPath, 'python.exe')
    : path.join(pythonPath, 'bin', 'python3');

  if (fs.existsSync(pythonBin)) {
    if (isWindows) {
      process.env.PATH = [
        pythonPath,
        path.join(pythonPath, 'Scripts'),
        process.env.PATH
      ].join(pathSeparator);
    } else {
      process.env.PATH = [
        path.join(pythonPath, 'bin'),
        process.env.PATH
      ].join(pathSeparator);
    }
    console.log(`[Portable Runtime] Python: ${pythonBin}`);
  }

  // ========== Node.js 配置 ==========
  const nodePath = path.join(portablePath, 'node');
  const nodeBin = isWindows
    ? path.join(nodePath, 'node.exe')
    : path.join(nodePath, 'bin', 'node');

  if (fs.existsSync(nodeBin)) {
    if (isWindows) {
      process.env.PATH = [nodePath, process.env.PATH].join(pathSeparator);
    } else {
      process.env.PATH = [path.join(nodePath, 'bin'), process.env.PATH].join(pathSeparator);
    }
    console.log(`[Portable Runtime] Node.js: ${nodeBin}`);
  }

  // ========== 镜像源配置 ==========
  process.env.npm_config_registry = mirror.npm;
  process.env.YARN_REGISTRY = mirror.npm;
  process.env.PIP_INDEX_URL = mirror.pip;
  process.env.PIP_TRUSTED_HOST = mirror.pipTrustedHost;
  process.env.ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/';
  process.env.SASS_BINARY_SITE = 'https://npmmirror.com/mirrors/node-sass/';
  process.env.PUPPETEER_DOWNLOAD_HOST = 'https://npmmirror.com/mirrors';

  console.log(`[Portable Runtime] Mirror: ${mirrorPreset}`);
}

export function getPortableRuntimeStatus(): {
  gitBash: boolean;
  python: boolean;
  node: boolean;
} {
  const resourcesPath = process.resourcesPath || path.join(app.getAppPath(), 'resources');
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  const portablePath = path.join(
    resourcesPath,
    isWindows ? 'portable-win' : isMac ? 'portable-darwin' : 'portable-linux'
  );

  return {
    gitBash: isWindows
      ? fs.existsSync(path.join(portablePath, 'git', 'bin', 'bash.exe'))
      : true, // macOS/Linux 自带
    python: fs.existsSync(
      isWindows
        ? path.join(portablePath, 'python', 'python.exe')
        : path.join(portablePath, 'python', 'bin', 'python3')
    ),
    node: fs.existsSync(
      isWindows
        ? path.join(portablePath, 'node', 'node.exe')
        : path.join(portablePath, 'node', 'bin', 'node')
    ),
  };
}
```

---

## 构建配置

### electron-builder 配置

```json
{
  "win": {
    "target": ["nsis"],
    "extraResources": [
      {
        "from": "resources/portable-win",
        "to": "portable-win",
        "filter": ["**/*"]
      }
    ]
  },
  "mac": {
    "target": ["dmg", "zip"],
    "extraResources": [
      {
        "from": "resources/portable-darwin",
        "to": "portable-darwin",
        "filter": ["**/*"]
      }
    ]
  }
}
```

---

## 下载脚本

### Windows 下载脚本

```bash
#!/bin/bash
# scripts/download-portable-win.sh

PORTABLE_DIR="apps/electron/resources/portable-win"
mkdir -p "$PORTABLE_DIR"

# Git for Windows Portable
GIT_VERSION="2.43.0"
curl -L -o /tmp/git-portable.7z.exe \
  "https://npmmirror.com/mirrors/git-for-windows/v${GIT_VERSION}.windows.1/PortableGit-${GIT_VERSION}-64-bit.7z.exe"
7z x /tmp/git-portable.7z.exe -o"$PORTABLE_DIR/git"

# Python Embeddable
PYTHON_VERSION="3.11.7"
curl -L -o /tmp/python-embed.zip \
  "https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip"
unzip /tmp/python-embed.zip -d "$PORTABLE_DIR/python"

# 安装 pip
curl -L -o "$PORTABLE_DIR/python/get-pip.py" https://bootstrap.pypa.io/get-pip.py
"$PORTABLE_DIR/python/python.exe" "$PORTABLE_DIR/python/get-pip.py"

# 修改 python311._pth
echo "python311.zip
.
Lib/site-packages
import site" > "$PORTABLE_DIR/python/python311._pth"

# Node.js
NODE_VERSION="20.11.0"
curl -L -o /tmp/node.zip \
  "https://npmmirror.com/mirrors/node/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
unzip /tmp/node.zip -d /tmp/node-extract
mv "/tmp/node-extract/node-v${NODE_VERSION}-win-x64" "$PORTABLE_DIR/node"

echo "Windows portable runtime ready!"
```

### macOS 下载脚本

```bash
#!/bin/bash
# scripts/download-portable-darwin.sh

PORTABLE_DIR="apps/electron/resources/portable-darwin"
mkdir -p "$PORTABLE_DIR"

# 检测架构
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  PYTHON_ARCH="aarch64"
  NODE_ARCH="arm64"
else
  PYTHON_ARCH="x86_64"
  NODE_ARCH="x64"
fi

# Python Standalone
PYTHON_VERSION="3.11.7"
PYTHON_RELEASE="20240107"
curl -L -o /tmp/python.tar.gz \
  "https://github.com/indygreg/python-build-standalone/releases/download/${PYTHON_RELEASE}/cpython-${PYTHON_VERSION}+${PYTHON_RELEASE}-${PYTHON_ARCH}-apple-darwin-install_only.tar.gz"
mkdir -p "$PORTABLE_DIR/python"
tar -xzf /tmp/python.tar.gz -C "$PORTABLE_DIR/python" --strip-components=1

# 确保 pip 可用
"$PORTABLE_DIR/python/bin/python3" -m ensurepip --upgrade

# Node.js
NODE_VERSION="20.11.0"
curl -L -o /tmp/node.tar.gz \
  "https://npmmirror.com/mirrors/node/v${NODE_VERSION}/node-v${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz"
mkdir -p "$PORTABLE_DIR/node"
tar -xzf /tmp/node.tar.gz -C "$PORTABLE_DIR/node" --strip-components=1

echo "macOS portable runtime ready!"
```

### 通用下载脚本

```bash
#!/bin/bash
# scripts/download-portable-runtime.sh
# Usage:
#   ./scripts/download-portable-runtime.sh          # Auto-detect platform
#   ./scripts/download-portable-runtime.sh darwin   # Download for macOS
#   ./scripts/download-portable-runtime.sh win      # Download for Windows
#   ./scripts/download-portable-runtime.sh all      # Download for all platforms

TARGET="${1:-auto}"

case "$TARGET" in
  darwin|mac|macos)
    ./scripts/download-portable-darwin.sh
    ;;
  win|windows)
    ./scripts/download-portable-win.sh
    ;;
  all)
    ./scripts/download-portable-darwin.sh
    ./scripts/download-portable-win.sh
    ;;
  auto)
    case "$(uname -s)" in
      Darwin)
        ./scripts/download-portable-darwin.sh
        ;;
      MINGW*|MSYS*|CYGWIN*)
        ./scripts/download-portable-win.sh
        ;;
    esac
    ;;
esac
```

---

## 体积估算

| 平台 | 组件 | 压缩后 | 解压后 |
|------|------|--------|--------|
| **Windows** | Git + Python + Node | ~95MB | ~410MB |
| **macOS** | Python + Node | ~50MB | ~180MB |

---

## 注意事项

### Windows
1. **Git Bash 路径**：使用 Unix 风格路径（`/c/Users/...`）
2. **杀毒软件**：可能误报，需添加白名单
3. **权限**：某些操作可能需要管理员权限

### macOS
1. **代码签名**：打包的二进制文件需要重新签名或移除签名
2. **Gatekeeper**：首次运行可能被阻止，需要在系统偏好设置中允许
3. **Universal Binary**：如需同时支持 Intel 和 Apple Silicon，需要打包两套或使用 Universal Binary

### 通用
1. **更新机制**：需要考虑如何更新打包的运行时版本
2. **磁盘空间**：解压后占用较大空间，需要在安装时提示用户

---

## 后续优化

1. **按需下载**：首次使用时再下载运行时，减少初始安装包体积
2. **增量更新**：只更新变化的文件
3. **系统检测**：检测系统已安装的运行时，避免重复
4. **镜像测速**：自动选择最快的镜像源
