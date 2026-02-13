---
title: 快速开始
order: 1
---

# 快速开始

## 简介

Craft Plus 将 Claude 的编码能力带到您的整个数字工作流程。它基于 Claude Agent SDK 构建，可以跨所有工具工作：GitHub、Linear、Slack、Craft 文档、本地文件以及任何您可以连接的 API。

### 主要优势

- **熟悉的界面**：收件箱式工作方式，类似邮件和任务管理器的组合
- **连接一切**：通过 Sources 连接 MCP 服务器、REST API 或本地文件
- **多任务处理**：启动多个任务，在会话间切换，完整历史记录保留
- **探索后执行**：先在只读模式下研究分析，确认后再执行
- **会话即文档**：每个会话都记录决策、权衡和实现细节

### 关键概念

| 概念 | 描述 |
|------|------|
| **Sources** | 连接外部数据的方式 - GitHub、Linear、Craft 空间或本地文件系统 |
| **Workspaces** | 隔离的环境，拥有独立的源、技能和会话 |
| **Permission Modes** | 控制代理可以做什么，使用 `SHIFT+TAB` 切换 |
| **Sessions** | 持久化的会话，像收件箱一样组织 |
| **Skills** | 自定义指令，定义专门的代理行为 |

### 权限模式

| 模式 | 行为 |
|------|------|
| **Explore** | 只读模式，无风险地研究和分析 |
| **Ask to Edit** | 更改前提示确认，逐个审查操作 |
| **Execute** | 完全自主，代理不间断工作 |

## 安装

Craft Plus 是原生桌面应用，在本地运行，凭据加密存储在磁盘上。

### 系统要求

| 平台 | 架构 | 备注 |
|------|------|------|
| **macOS** | Intel, Apple Silicon | macOS 11+ |
| **Windows** | x64 | Windows 10+ |
| **Linux** | x64 | AppImage 格式，需要 FUSE |

### 手动安装（推荐）

#### macOS

**Apple Silicon (M1/M2/M3/M4):**
```
https://agents.craft.do/electron/latest/Craft-Agent-arm64.dmg
```

**Intel:**
```
https://agents.craft.do/electron/latest/Craft-Agent-x64.dmg
```

1. 下载对应架构的 `.dmg` 文件
2. 打开 DMG 并将 Craft Agent 拖到 Applications
3. 从 Applications 或 Spotlight (`CMD+Space`，输入 "Craft Agent") 启动

#### Windows

从官网下载 Windows 安装程序并运行。

#### Linux

下载 AppImage 文件并运行。

### 脚本安装

自动安装并校验：

**macOS / Linux:**
```bash
curl -fsSL https://agents.craft.do/install-app.sh | bash
```

### 从源码构建

#### 前置条件

- [Bun](https://bun.sh) — 运行时和包管理器
- [Node.js](https://nodejs.org) 18+ — electron-builder 需要
- Git

#### 克隆和构建

```bash
# 克隆仓库
git clone https://github.com/lukilabs/craft-agents-oss.git
cd craft-agents-oss

# 安装依赖
bun install

# 开发模式（热重载）
bun run electron:dev

# 生产构建
bun run electron:start
```

#### 构建安装包

**macOS:**
```bash
# Apple Silicon
bash apps/electron/scripts/build-dmg.sh arm64

# Intel
bash apps/electron/scripts/build-dmg.sh x64
```

输出：`apps/electron/release/Craft-Agent-{arch}.dmg`

> **注意**：代码签名和公证需要 Apple Developer 凭据。设置 `APPLE_SIGNING_IDENTITY`、`APPLE_ID`、`APPLE_TEAM_ID` 和 `APPLE_APP_SPECIFIC_PASSWORD` 环境变量。

### 启动

安装后：

- **macOS** — Applications 文件夹或 Spotlight (`CMD+Space`，输入 "Craft Agent")
- **Windows** — 开始菜单、桌面快捷方式或终端中输入 `craft-agents`
- **Linux** — 终端运行 `craft-agents` 或直接运行 AppImage

首次启动会打开设置向导。
