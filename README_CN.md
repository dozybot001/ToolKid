[English](./README.md)

# ToolKid

一组小而专注的 Web 工具，共享一套技术栈，统一入口。

**在线体验：** https://dozybot001.github.io/ToolKid/

## 工具

| 工具 | 路径 | 一句话 |
|------|------|--------|
| **CalmMD** | `/calmmd` | 本地 Markdown 阅读器 — 阅读优先，不是编辑器 |
| **Translator** | `/translator` | 多模型协作 PDF 翻译（仅 UI，核心功能开发中） |
| **QuizGo** | `/quizgo` | JSON 闪卡 — 点击翻卡，支持 Markdown、公式与代码 |
| **Auto Space** | `/auto-space` | 中英文之间自动加空格 |
| **Pure Color** | `/pure-color` | 全屏纯色显示，看片灯 / 屏幕测试 |
| **Fetch README** | `/fetch-readme` | 批量下载 GitHub 用户所有仓库的 README |
| **File Size** | `/file-size-chart` | 可视化分析本地文件夹大小分布 |
| **Prompt Amplifier** | `/prompt-amp` | 将粗略想法通过 3 轮 AI 分析，扩展为可编辑的结构化详细规格 |

## CalmMD 核心主张

> Markdown 工具的问题不在"能不能渲染"，而在"有没有把阅读体验当作第一目标"。

- **阅读优先** — 所有决策以"读起来舒不舒服"为唯一标准
- **内容优先** — 界面服务内容，不喧宾夺主
- **本地优先** — 无账号、无云端、无同步，文件留在你手里
- **弱工具感** — 减少控件、边框、按钮，让人忘记在用工具
- **不做什么** — 不做编辑器，不做知识库，不做协作平台

## 设计规范

ToolKid 有一套统一的设计系统（`src/styles/tokens.css` + `toolkit.css`）：

- 深色背景 `#0e0e12`，低对比度表面层级
- 无衬线 UI 字体 + 等宽代码字体
- 强调色 `--tk-accent`（金色 `#c9a87a`）用于关键操作和高亮
- 通用组件类（`tk-btn`、`tk-input`、`tk-textarea`、`tk-page`）

有独立设计语言的工具（如 CalmMD）保留自己的风格，其余工具共用统一规范。

## 开发

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # 生产构建 → dist/
```

## 技术栈

React 19 · Vite 6 · TypeScript · React Router（lazy loading）

每个工具是 `src/features/<tool>/` 下的独立模块，CSS 用根类名隔离，按需加载。

## 添加新工具

1. 在 `src/features/<tool-name>/` 下创建 `index.tsx` 和 `styles.css`
2. 使用 `tk-page`、`tk-btn` 等统一组件（或自定义风格）
3. 在 `src/App.tsx` 添加 lazy route
4. 在 `src/data/tools.ts` 添加卡片数据
