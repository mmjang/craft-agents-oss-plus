# 技能 (Skills)

Skills 扩展 Craft Agents 的能力。创建一个带有指令的 `SKILL.md` 文件，Craft Agents 会将其添加到工具包中 - 在相关时自动使用，或在您 `@mention` 时直接调用。

Skills 遵循 [Agent Skills](https://agentskills.io) 开放标准，与 Claude Code 和其他支持该规范的工具兼容。

## 创建 Skills

**最简单的方式是让 Craft Agents 创建。** 描述您想要的，代理会为您创建 skill：

```
Create a skill called "commit" that generates conventional commit messages
```

Craft Agents 知道 skills 存放在哪里以及如何编写它们。

## Skill 结构

Skills 是工作区中包含 `SKILL.md` 文件的文件夹：

```
~/.craft-agent/workspaces/{id}/skills/{slug}/
├── SKILL.md    # 必需：YAML frontmatter + 指令
└── icon.png    # 自动生成：从 URL 缓存的图标（如果指定）
```

## SKILL.md 格式

```yaml
---
name: Commit
description: Create well-formatted git commit messages
icon: 🔧
globs:
  - "**/.git/**"
alwaysAllow:
  - Bash(git status)
  - Bash(git diff)
---

When creating commits:
- Use conventional commit format (feat:, fix:, docs:, etc.)
- Keep subject line under 72 characters
- Explain why, not what
```

frontmatter 告诉 Craft Agents 何时使用 skill。正文包含调用时代理遵循的指令。

## Frontmatter 字段

| 字段 | 必需 | 描述 |
|------|------|------|
| `name` | 是 | skill 的显示名称 |
| `description` | 是 | skill 列表中显示的简短描述 |
| `icon` | 否 | Emoji (如 🔧) 或 URL。不支持相对路径 |
| `globs` | 否 | 自动触发此 skill 的文件模式 (如 `["**/*.test.ts"]`) |
| `alwaysAllow` | 否 | skill 激活时自动允许的工具 (如 `["Bash(npm test)"]`) |

> **信息**：完整的 SKILL.md schema 包括高级字段如 `allowed-tools`、`context` 和 `agent`，请参阅 [Claude Code skills 文档](https://code.claude.com/docs/en/skills)。

## 使用 Skills

在消息中用 `@` 提及 skill：

```
@commit
@review the authentication changes
@deploy to staging
```

## Skill 位置

| 位置 | 路径 | 优先级 |
|------|------|--------|
| 工作区 | `~/.craft-agent/workspaces/{id}/skills/{slug}/` | 第一（覆盖内置） |
| 内置 | 与 Craft Agents 捆绑 | 后备 |

创建与内置 skill 相同 slug 的工作区 skill 可以用您自己的行为覆盖它。

## 示例 Skills

### Code Review Skill

```yaml
---
name: Review
description: Review code changes for quality and best practices
icon: 👀
globs:
  - "**/*.ts"
  - "**/*.tsx"
---

When reviewing code:
1. Check for potential bugs and edge cases
2. Verify error handling is appropriate
3. Look for performance issues
4. Ensure code follows project conventions
5. Suggest improvements where applicable
```

### Deploy Skill

```yaml
---
name: Deploy
description: Deploy application to staging or production
icon: 🚀
alwaysAllow:
  - Bash(npm run build)
  - Bash(npm run test)
---

Deployment checklist:
1. Run all tests
2. Build the application
3. Verify build artifacts
4. Deploy to specified environment
5. Verify deployment health
```

### Research Skill

```yaml
---
name: Research
description: Research topics and summarize findings
icon: 🔍
---

When researching:
1. Search for relevant information
2. Verify sources are credible
3. Summarize key findings
4. Cite sources when appropriate
5. Highlight any conflicting information
```
