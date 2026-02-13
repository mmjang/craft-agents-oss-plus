---
title: 核心概念
order: 2
---

# 核心概念

## 会话

Craft Plus 将会话组织成类似邮件收件箱的形式，便于管理多个进行中的任务并返回之前的工作。

### 多会话收件箱

每个会话是一个独立的线程，您可以：

- 随时启动、暂停和恢复
- 按状态组织（Todo、In Progress、Needs Review、Done 等）
- 搜索和过滤以查找过去的工作
- 不再需要时归档或删除

### 会话 ID 格式

每个会话有唯一的 ID，格式为：

```
YYMMDD-adjective-noun
```

例如：
- `260121-swift-falcon` - 2026年1月21日创建
- `260115-gentle-river` - 2026年1月15日创建

### 会话存储

会话以 JSONL（JSON Lines）格式存储在本地：

```
~/.craft-agent/workspaces/{id}/sessions/{session-id}/session.jsonl
```

文件格式：
- **第1行**：会话头部，包含元数据
- **第2行起**：消息（每行一条）

#### 会话头部字段

| 字段 | 描述 |
|------|------|
| `id` | 会话 ID (YYMMDD-adjective-noun) |
| `workspaceRootPath` | 工作区路径 |
| `createdAt` | 创建时间戳 (ms) |
| `lastUsedAt` | 最后活动时间戳 (ms) |
| `todoState` | 状态 ID (如 "todo", "done") |
| `permissionMode` | 当前模式: "safe", "ask", "allow-all" |
| `name` | 可选的用户定义名称 |
| `workingDirectory` | bash 命令的工作目录 |

### 状态组织

| 状态 | 类别 | 描述 |
|------|------|------|
| **Todo** | Open | 等待处理的会话 |
| **In Progress** | Open | 正在进行的会话 |
| **Needs Review** | Open | 需要审查后才能完成 |
| **Done** | Closed | 已完成的会话 |
| **Cancelled** | Closed | 不再需要的会话 |

**Open** 状态显示在收件箱；**Closed** 状态归档。

### 会话连续性

返回会话时，Craft Plus 恢复完整上下文：

- 所有之前的消息都可用
- 代理记得讨论过的内容
- 可以从中断处继续
- 引用的文档和文件仍可访问

### 长会话

对于长时间工作会话，Craft Plus 自动管理上下文：

- 超过 15,000 tokens 的大型工具结果会自动摘要
- Claude Agent SDK 透明处理上下文窗口管理
- 最近的上下文始终可供参考

## 工作目录

工作目录是代理的当前工作目录 (cwd)，就像终端中的 `cwd`。所有文件操作和 bash 命令默认相对于此文件夹执行。

### 可用工具

这些 SDK 原生工具默认从您的 cwd 操作：

| 工具 | 用途 | 示例 |
|------|------|------|
| **Read** | 查看文件内容 | 读取配置文件 |
| **Write** | 创建或覆盖文件 | 写入新组件 |
| **Edit** | 精确文本替换 | 修复现有代码中的 bug |
| **Glob** | 按模式查找文件 | 查找所有 `*.tsx` 文件 |
| **Grep** | 搜索文件内容 | 查找函数的使用 |
| **Bash** | 运行 shell 命令 | 运行测试、git 操作 |

### 设置工作目录

#### 每会话设置

点击聊天输入区域的文件夹徽章来设置或更改当前会话的 cwd。

徽章显示：
- **文件夹图标** 和当前目录名
- **Git 分支**（如果目录是 git 仓库）

#### 工作区默认值

为工作区中的所有新会话设置默认工作目录：

1. 打开 **Settings** → **Workspace Settings**
2. 找到 **Default Working Directory**
3. 点击选择文件夹

### CLAUDE.md 项目上下文

如果工作目录包含 `CLAUDE.md` 文件，其内容会自动注入到代理的上下文中。用于提供：

- 项目结构和约定
- 构建和测试命令
- 重要文件及其用途
- 团队特定指南

```markdown
# CLAUDE.md

This is a Next.js application with TypeScript.

## Commands
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run build` - Production build

## Structure
- `src/components/` - React components
- `src/lib/` - Utility functions
- `src/app/` - Next.js app router pages
```

### 工作目录 vs Sources

| 方面 | 工作目录 | Sources |
|------|----------|---------|
| **访问方式** | 直接 SDK 工具 (`Read`, `Write`, `Bash`) | MCP 工具 (`mcp__slug__toolname`) |
| **范围** | 单个本地文件夹 | 多个服务/路径 |
| **认证** | 不需要 | OAuth、API 密钥、令牌 |
| **权限控制** | SDK 权限模式 | 每源 `permissions.json` |
| **项目上下文** | `CLAUDE.md` 注入 | `guide.md` 指令 |
| **典型用途** | 编码、本地文件 | 外部服务、远程数据 |

## 权限

Craft Plus 可以代表您执行强大的操作 - 读取文件、运行命令和修改文档。为了让您保持控制，应用提供三种权限模式。

### 权限模式

使用 **SHIFT+TAB** 循环切换：

| 模式 | 描述 | 用例 |
|------|------|------|
| **Explore** | 只读探索 | 安全的研究和调查 |
| **Ask to Edit** | 编辑前提示 | 受控工作的默认模式 |
| **Execute** | 完全自主执行 | 可信的自动化工作流 |

### Explore 模式（安全模式）

只读安全模式，用于研究和调查。代理可以收集信息但不能做任何更改。

**允许的操作：**
- `Read` - 读取文件内容
- `Glob` - 按模式查找文件
- `Grep` - 搜索文件内容
- `WebSearch`, `WebFetch` - 网络搜索和内容获取
- 只读 bash 命令

**阻止的操作：**
- `Write` - 创建或覆盖文件
- `Edit`, `MultiEdit` - 修改文件内容
- Bash 变更操作 (`rm`, `mv`, `mkdir` 等)
- MCP 工具变更操作
- API 变更操作 (POST, PUT, DELETE)

### Ask to Edit 模式（默认）

使用三层权限系统：

| 命令类型 | 行为 |
|----------|------|
| **安全命令** | 自动允许（与 Explore 模式相同） |
| **常规命令** | 提示批准，可使用"始终允许" |
| **危险命令** | 提示批准，"始终允许"被禁用 |

### Execute 模式（Allow-All 模式）

完全自主执行能力。操作无需提示运行。

> ⚠️ **警告**：Execute 模式绕过权限提示。仅在完全信任执行的操作时使用。

### 危险命令

需要额外谨慎的命令子集：

```bash
rm, rmdir           # 文件/目录删除
mv, cp              # 文件移动/复制（可覆盖）
sudo, su            # 权限提升
chmod, chown        # 权限更改
curl, wget          # 网络下载
git push            # 推送到远程仓库
git reset           # 重置 git 状态
```

### 安全命令

Explore 模式允许的只读命令：

**文件探索：**
```bash
ls, ll, la, tree    # 目录列表
cat, head, tail     # 文件查看
file, stat, du, df  # 文件信息
```

**搜索工具：**
```bash
find, locate, which
grep, rg, ag, fd
```

**Git（只读）：**
```bash
git status, git log, git diff, git show
git branch, git tag, git remote
```

**包管理器（只读）：**
```bash
npm ls/list/view/outdated
yarn list/info/why
pip list/show/freeze
```

### 自定义 Explore 模式

最简单的方式是告诉代理您需要什么：

- "Allow npm build in Explore mode"
- "Let Linear comments work in safe mode"
- "Add bun run test to allowed commands"

代理会自动处理配置文件。

#### 权限配置

权限通过 `permissions.json` 文件在多个级别配置：

```
~/.craft-agent/permissions/default.json              # 应用级默认
~/.craft-agent/workspaces/{id}/permissions.json      # 工作区级
~/.craft-agent/workspaces/{id}/sources/{slug}/permissions.json  # 源级
```

#### 配置示例

```json
{
  "allowedBashPatterns": [
    { "pattern": "^npm run build\\b", "comment": "Allow npm build" },
    { "pattern": "^make\\s+test\\b", "comment": "Allow make test" }
  ],
  "allowedMcpPatterns": [
    { "pattern": "create_draft", "comment": "Allow creating drafts" }
  ],
  "allowedWritePaths": [
    "tmp/**",
    "*.draft.md"
  ]
}
```
