# Craft Plus 用户手册

Craft Plus 是一款开源桌面应用，将 Claude 的编码能力扩展到您的整个数字工作流程。它基于 Claude Agent SDK 构建，可以连接 GitHub、Linear、Slack、Craft 文档、本地文件以及任何您可以连接的 API。

## 目录

- [快速开始](./getting-started.md)
  - [简介](./getting-started.md#简介)
  - [安装](./getting-started.md#安装)
- [核心概念](./core-concepts.md)
  - [会话](./core-concepts.md#会话)
  - [工作目录](./core-concepts.md#工作目录)
  - [权限](./core-concepts.md#权限)
- [数据源](./sources.md)
  - [概述](./sources.md#概述)
  - [MCP 服务器](./sources.md#mcp-服务器)
  - [REST API](./sources.md#rest-api)
  - [本地文件夹](./sources.md#本地文件夹)
- [技能](./skills.md)
- [状态](./statuses.md)
- [自定义](./customization.md)
  - [主题](./customization.md#主题)
  - [工作区](./customization.md#工作区)
- [macOS 安全提示解决方法](./mac-security.md)

## 主要特性

| 特性 | 描述 |
|------|------|
| 熟悉的界面 | 类似邮件和任务管理器的收件箱式界面 |
| 连接一切 | 支持 MCP 服务器、REST API 和本地文件 |
| 多任务处理 | 可同时启动多个任务，在会话间切换 |
| 探索后执行 | 先在只读模式下研究分析，确认后再执行 |
| 会话即文档 | 每个会话都记录决策和实现细节 |
| 完全可定制 | 主题、技能、状态、权限都可配置 |

## Craft Plus vs Claude Code

| 方面 | Claude Code | Craft Plus |
|------|-------------|--------------|
| 界面 | 终端 CLI | 桌面应用 |
| 数据源 | MCP 服务器 | MCP + REST API + 本地文件 |
| 会话管理 | `-c` 标志继续 | 带自定义状态的收件箱 |
| 配置范围 | 项目级 `.claude/` | 多工作区完全隔离 |
| 权限 | 固定模式行为 | 可按工作区/源自定义规则 |

## 开源

Craft Plus 采用 Apache 2.0 许可证开源。代码仓库位于 [github.com/lukilabs/craft-agents-oss](https://github.com/lukilabs/craft-agents-oss)。
