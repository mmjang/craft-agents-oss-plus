# 数据源 (Sources)

## 概述

Sources 是为代理提供动力的数据连接。它们让代理访问外部服务、API 和文件，以完成需要真实数据的任务。

> **提示**：对于单个目录的直接文件系统访问，使用[工作目录](./core-concepts.md#工作目录)。它提供内置工具如 `Read`、`Write` 和 `Bash`，无需 MCP 配置。Sources 最适合外部服务或访问多个文件位置。

### 添加 Sources 的最简方式

告诉代理您需要什么：

- "Connect my GitHub account"
- "Add Slack to this workspace"
- "Set up access to my Obsidian vault"

代理会自动处理配置、认证和验证。

### Source 类型

| 类型 | 描述 | 示例 |
|------|------|------|
| **MCP 服务器** | 标准化 AI 工具集成 | Linear, GitHub, Brave Search |
| **REST API** | 任何有 HTTP 端点的服务 | Exa Search, 自定义后端 |
| **本地文件夹** | 机器上的文件夹书签 | 笔记、下载、参考目录 |

### Source 工作原理

每个 source 存储在文件夹中：

```
~/.craft-agent/workspaces/{workspace-id}/sources/{source-slug}/
```

Source 文件夹包含：

| 文件 | 描述 | 必需 |
|------|------|------|
| `config.json` | 连接设置、认证类型、状态 | 是 |
| `guide.md` | 代理如何使用此 source 的指令 | 否 |
| `permissions.json` | Explore 模式的自定义规则 | 否 |
| `icon.*` | source 的视觉图标 | 否 |

### config.json

定义如何连接到 source：

```json
{
  "type": "mcp",
  "name": "Linear",
  "slug": "linear",
  "enabled": true,
  "provider": "linear",
  "mcp": {
    "url": "https://mcp.linear.app",
    "authType": "oauth"
  },
  "isAuthenticated": true,
  "connectionStatus": "connected"
}
```

关键字段：

| 字段 | 描述 |
|------|------|
| `type` | Source 类型: `mcp`, `api`, 或 `local` |
| `enabled` | source 是否激活 |
| `provider` | 服务标识符 (如 `"linear"`, `"github"`) |
| `isAuthenticated` | 凭据是否已存储 |
| `connectionStatus` | 当前状态: `connected`, `needs_auth`, `failed`, `untested` |

### guide.md

帮助代理理解如何有效使用 source：

```markdown
# Linear

Issue and project tracking for the iOS team.

## Scope
Access to the "Craft iOS" project and related issues.

## Guidelines
- Search issues before creating duplicates
- Use labels consistently with team conventions
- Check sprint assignments before moving issues
```

> **提示**：写得好的 guide.md 能显著提高代理的效率。包含具体的项目名称、团队约定和常见工作流。

### Explore 模式权限

默认情况下，sources 在 Explore 模式下以只读访问工作。创建 `permissions.json` 定义哪些操作是安全的：

```json
{
  "allowedMcpPatterns": [
    { "pattern": "list", "comment": "All list operations" },
    { "pattern": "get", "comment": "All read operations" },
    { "pattern": "search", "comment": "All search operations" }
  ]
}
```

模式会自动限定到 source，所以 `list` 在内部变成 `mcp__linear__.*list`。

## MCP 服务器

Model Context Protocol 服务器提供丰富的预构建工具集成。许多服务提供官方 MCP 支持。

### 常见 MCP 服务器

- **Linear** - 问题和项目跟踪
- **GitHub** - 仓库、PR、issues
- **Brave Search** - 网络搜索
- **Craft** - 文档和笔记

## REST API

连接任何有 API 的服务。提供文档，代理就可以进行认证请求。

### 配置示例

```json
{
  "type": "api",
  "name": "Custom API",
  "slug": "custom-api",
  "enabled": true,
  "api": {
    "baseUrl": "https://api.example.com",
    "authType": "bearer"
  }
}
```

## 本地文件夹

在机器上添加文件夹书签，带有文档和快速访问。

### 用例

- Obsidian vaults
- 代码仓库
- 下载目录
- 参考文档

### 配置示例

```json
{
  "type": "local",
  "name": "Notes",
  "slug": "notes",
  "enabled": true,
  "local": {
    "path": "/Users/username/Documents/Notes"
  }
}
```
