# 自定义

## 主题

Craft Agent 使用 6 色主题系统，让您自定义视觉外观。您可以覆盖特定颜色或安装带有完整视觉样式的预设主题。

### 6 色系统

| 颜色 | 用途 | 使用场景 |
|------|------|----------|
| `background` | 表面/页面背景 | 浅色/深色表面颜色 |
| `foreground` | 文本和图标 | 主要文本颜色 |
| `accent` | 品牌色，Execute 模式 | 高亮、活跃状态、紫色 UI 元素 |
| `info` | 警告，Ask 模式 | 琥珀色指示器、注意状态 |
| `success` | 已连接状态 | 绿色勾选、成功状态 |
| `destructive` | 错误、删除操作 | 红色警报、失败状态 |

### 主题覆盖文件

创建 `~/.craft-agent/theme.json` 来覆盖特定颜色：

```json
{
  "accent": "oklch(0.58 0.22 293)",
  "dark": {
    "accent": "oklch(0.65 0.22 293)"
  }
}
```

所有字段都是可选的。只指定您想覆盖的颜色。

### 深色模式支持

`dark` 对象为深色模式提供可选覆盖。当用户系统处于深色模式时：

- 基础颜色（顶级）用作默认值
- `dark` 中定义的任何颜色覆盖基础颜色

### 预设主题

预设��题是存储在 `~/.craft-agent/themes/` 的完整主题包。每个预设是一个带有主题颜色和元数据的 JSON 文件。

#### 预设主题 Schema

```json
{
  "name": "Dracula",
  "description": "A dark theme with vibrant colors",
  "author": "Zeno Rocha",
  "license": "MIT",
  "source": "https://draculatheme.com",
  "supportedModes": ["dark"],
  "background": "oklch(0.22 0.02 280)",
  "foreground": "oklch(0.95 0.01 270)",
  "accent": "oklch(0.70 0.20 320)",
  "info": "oklch(0.78 0.14 70)",
  "success": "oklch(0.72 0.18 145)",
  "destructive": "oklch(0.65 0.22 28)",
  "shikiTheme": {
    "light": "github-light",
    "dark": "dracula"
  }
}
```

#### 预设元数据字段

| 字段 | 描述 |
|------|------|
| `name` | 主题显示名称 |
| `description` | 简短描述 |
| `author` | 主题创建者 |
| `license` | 许可证类型 (MIT 等) |
| `source` | 原始主题 URL |
| `supportedModes` | `"light"`、`"dark"` 或两者的数组 |
| `shikiTheme` | 语法高亮主题（浅色/深色变体） |

#### 安装预设主题

1. 下载或创建主题 JSON 文件
2. 保存到 `~/.craft-agent/themes/{name}.json`
3. 在 Settings → Appearance 中选择主题

### 风景模式

风景模式显示全窗口背景图像和玻璃风格面板，创造视觉沉浸体验。

#### 启用风景模式

```json
{
  "mode": "scenic",
  "backgroundImage": "mountains.jpg",
  "background": "oklch(0.15 0.02 270 / 0.8)",
  "paper": "oklch(0.18 0.02 270 / 0.6)",
  "navigator": "oklch(0.12 0.02 270 / 0.7)",
  "popoverSolid": "oklch(0.18 0.02 270)"
}
```

#### 风景模式属性

| 属性 | 描述 |
|------|------|
| `mode` | 设置为 `"scenic"`（默认是 `"solid"`） |
| `backgroundImage` | 图像文件名（相对于主题文件）或 URL |

#### 玻璃面板的表面颜色

| 颜色 | 用途 |
|------|------|
| `paper` | AI 消息、卡片、提升的内容 |
| `navigator` | 左侧边栏背景 |
| `input` | 输入字段背景 |
| `popover` | 下拉菜单、模态框、上下文菜单 |
| `popoverSolid` | 保证 100% 不透明的弹出背景 |

> **注意**：风景主题自动强制深色模式以获得更好的背景图像对比度。

### 颜色格式

支持任何有效的 CSS 颜色格式：

| 格式 | 示例 |
|------|------|
| Hex | `#8b5cf6`, `#8b5cf6cc`（带 alpha） |
| RGB | `rgb(139, 92, 246)`, `rgba(139, 92, 246, 0.8)` |
| HSL | `hsl(262, 83%, 58%)` |
| OKLCH | `oklch(0.58 0.22 293)` |
| 命名 | `purple`, `rebeccapurple` |

> **推荐**：使用 OKLCH 获得感知均匀的颜色，在浅色和深色模式下看起来一致。

### OKLCH 参考

格式：`oklch(lightness chroma hue)`

| 组件 | 范围 | 描述 |
|------|------|------|
| Lightness | 0-1 | 0 = 黑色，1 = 白色 |
| Chroma | 0-0.4 | 0 = 灰色，越高越饱和 |
| Hue | 0-360 | 色轮角度 |

**常见色相：**
- 红色: ~25
- 橙色: ~70
- 黄色: ~100
- 绿色: ~145
- 青色: ~195
- 蓝色: ~250
- 紫色: ~293
- 粉色: ~330

### 示例

#### 最小：只更改强调色

```json
{
  "accent": "#3b82f6"
}
```

#### 自定义品牌颜色

```json
{
  "accent": "oklch(0.55 0.25 250)",
  "info": "oklch(0.70 0.15 200)",
  "dark": {
    "accent": "oklch(0.65 0.25 250)",
    "info": "oklch(0.75 0.12 200)"
  }
}
```

#### 高对比度主题

```json
{
  "background": "#ffffff",
  "foreground": "#000000",
  "dark": {
    "background": "#000000",
    "foreground": "#ffffff"
  }
}
```

### 实时更新

主题更改立即应用 - 无需重启。编辑 theme.json，UI 自动更新。

## 工作区

工作区让您为不同上下文维护独立配置 - 个人项目、工作、客户项目或不同环境。每个工作区有自己的源、技能、状态和会话历史。

### 理解工作区

工作区是存储在以下位置的自包含配置单元：

```
~/.craft-agent/workspaces/{workspace-id}/
```

每个工作区包含：

| 组件 | 描述 |
|------|------|
| **Sources** | 连接到此工作区的 MCP 服务器、API 和本地文件系统 |
| **Skills** | 用 `@mention` 调用的可重用指令 |
| **Statuses** | 组织会话的工作流状态 |
| **Sessions** | 此工作区特定的聊天历史 |

### 添加工作区

初始设置时，您会自动创建第一个工作区。要添加更多：

1. 点击侧边栏中的工作区下拉菜单（显示当前工作区名称）
2. 选择 **Add Workspace…**
3. 输入新工作区的名称
4. 工作区以默认设置创建

### 切换工作区

1. 点击侧边栏中的工作区下拉菜单
2. 选择要切换到的工作区

侧边栏显示当前工作区名称。切换工作区会加载该工作区的源、技能、状态和会话。

### 工作区特定配置

每个工作区维护自己的：

| 数据 | 描述 |
|------|------|
| **Sources** | MCP 服务器、API 和本地文件系统 |
| **Skills** | 在 `skills/` 中定义的可重用指令 |
| **Statuses** | 在 `statuses/config.json` 中定义的工作流状态 |
| **Sessions** | 存储在 `sessions/` 中的聊天历史 |
| **Permissions** | `permissions.json` 中的可选 Explore 模式规则 |

### 目录结构

```
~/.craft-agent/
  workspaces/
    {workspace-id}/
      config.json                    # 工作区配置
      .claude-plugin/                # 插件清单（Claude Code SDK 兼容）
        plugin.json
      sources/
        {source-slug}/
          config.json                # 源配置
          guide.md                   # 使用文档
      skills/
        {skill-slug}/
          SKILL.md                   # Skill 定义
      statuses/
        config.json                  # 状态定义
        icons/                       # 自定义状态图标
          todo.svg
          done.svg
      sessions/
        {session-id}/
          session.jsonl              # JSONL 格式的会话
          attachments/               # 上传的文件
          plans/                     # 实现计划
      permissions.json               # 可选 Explore 模式规则
      icon.png                       # 可选工作区图标
```

### 用例

- **个人 vs 工作分离** - 保持个人项目和工作项目隔离
- **客户项目** - 每个客户一个工作区，有独立的源和配置
- **开发环境** - 开发、测试、生产的不同配置
- **团队协作** - 共享工作区配置

### 提示

- **清晰命名工作区** - 使用描述性名称便于识别
- **从一个工作区开始** - 熟悉后再添加更多
- **自定义 Explore 模式** - 为每个工作区配置适当的权限
