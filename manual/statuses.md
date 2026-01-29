# 状态 (Statuses)

状态帮助您将会话组织成工作流状态。每个会话都有一个状态，指示它在工作流中的位置 - 从初始想法到完成的任务。

## 状态工作原理

状态分为两类：

| 类别 | 描述 | 显示位置 |
|------|------|----------|
| **Open** | 需要关注的活跃会话 | 收件箱 / 活跃列表 |
| **Closed** | 已完成或取消的会话 | 归档 |

创建新会话时，会分配默认状态（通常是 "Todo"）。随着工作进展，您可以将会话移动到不同状态直到完成。

## 默认状态

Craft Agents 附带五个默认状态：

| 状态 | 类别 | 描述 |
|------|------|------|
| **Backlog** | Open | 以后的想法和任务 |
| **Todo** | Open | 准备开始工作 |
| **Needs Review** | Open | 等待审查或反馈 |
| **Done** | Closed | 成功完成 |
| **Cancelled** | Closed | 不再需要 |

## 状态类型

状态有不同的可编辑级别，由配置中的 `isFixed` 和 `isDefault` 标志控制：

| 类型 | 描述 |
|------|------|
| **固定状态** (`isFixed: true`) | 不能删除或重命名 |
| **默认状态** (`isDefault: true`) | 新会话的默认状态 |
| **自定义状态** | 完全可编辑 |

## 工作区级配置

状态按工作区配置。每个工作区可以有自己的自定义状态集，针对该工作区的工作流定制。

配置存储在：
```
~/.craft-agent/workspaces/{workspace-id}/statuses/config.json
```

状态图标存储在：
```
~/.craft-agent/workspaces/{workspace-id}/statuses/icons/
```

## 更改会话状态

您可以随时使用状态菜单或键盘快捷键更改会话状态。

- 将会话移动到 **Closed** 状态（Done 或 Cancelled）会将其归档
- 将会话移动到 **Open** 状态会将其保留在收件箱中

> **注意**：在 Open 状态之间移动会话不会影响其内容或历史 - 只有组织状态会改变。

## 自定义状态

您可以添加自定义状态来匹配您的工作流。例如：

- **Blocked** - 等待外部依赖
- **Waiting** - 等待他人响应
- **In Review** - 正在审查中
- **Testing** - 测试阶段

### 配置示例

```json
{
  "statuses": [
    {
      "id": "backlog",
      "name": "Backlog",
      "category": "open",
      "icon": "backlog.svg",
      "color": "#6B7280"
    },
    {
      "id": "todo",
      "name": "Todo",
      "category": "open",
      "icon": "todo.svg",
      "color": "#3B82F6",
      "isDefault": true
    },
    {
      "id": "in-progress",
      "name": "In Progress",
      "category": "open",
      "icon": "in-progress.svg",
      "color": "#F59E0B"
    },
    {
      "id": "blocked",
      "name": "Blocked",
      "category": "open",
      "icon": "blocked.svg",
      "color": "#EF4444"
    },
    {
      "id": "needs-review",
      "name": "Needs Review",
      "category": "open",
      "icon": "review.svg",
      "color": "#8B5CF6"
    },
    {
      "id": "done",
      "name": "Done",
      "category": "closed",
      "icon": "done.svg",
      "color": "#10B981",
      "isFixed": true
    },
    {
      "id": "cancelled",
      "name": "Cancelled",
      "category": "closed",
      "icon": "cancelled.svg",
      "color": "#6B7280",
      "isFixed": true
    }
  ]
}
```

## 状态图标

每个状态可以有自定义图标。将 SVG 或 PNG 文件放在 `icons/` 目录中，并在配置中引用。

支持的格式：
- SVG（推荐）
- PNG
- Emoji（在 `icon` 字段中直接使用）
