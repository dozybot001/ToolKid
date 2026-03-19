# ToolKid

[中文](./README_CN.md) ｜ English

A collection of small, focused web tools sharing one tech stack and a unified entry point.

**Live:** https://dozybot001.github.io/ToolKid/

## Tools

| Tool | Path | Description |
|------|------|-------------|
| **CalmMD** | `/calmmd` | Local Markdown reader — reading-first, not an editor |
| **Translator** | `/translator` | Multi-model collaborative PDF translation (UI only, core functionality WIP) |
| **QuizGo** | `/quizgo` | JSON flashcards with Markdown, LaTeX & code support |
| **Auto Space** | `/auto-space` | Auto-insert spaces between CJK and Latin characters |
| **Pure Color** | `/pure-color` | Fullscreen solid color display for screen testing |
| **Fetch README** | `/fetch-readme` | Batch download READMEs from all repos of a GitHub user |
| **File Size** | `/file-size-chart` | Visualize local folder size distribution |
| **Prompt Amplifier** | `/prompt-amp` | Expand rough ideas into structured spec prompts via 3-round LLM calls |

## CalmMD Philosophy

> The problem with Markdown tools isn't rendering — it's whether the reading experience is treated as the primary goal.

- **Reading first** — every decision optimizes for reading comfort
- **Content first** — UI serves content, never the other way around
- **Local first** — no accounts, no cloud, no sync; files stay with you
- **Minimal tooling** — fewer controls, borders, and buttons; forget you're using a tool
- **What we don't do** — no editor, no knowledge base, no collaboration platform

## Design System

ToolKid has a unified design system (`src/styles/tokens.css` + `toolkit.css`):

- Dark background `#0e0e12` with low-contrast surface layers
- Sans-serif UI font + monospace code font
- Accent color `--tk-accent` (gold `#c9a87a`) for key actions and highlights
- Shared component classes (`tk-btn`, `tk-input`, `tk-textarea`, `tk-page`)

Tools with their own design language (e.g. CalmMD) keep their own styles; the rest share the unified system.

## Development

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
```

## Tech Stack

React 19 · Vite 6 · TypeScript · React Router (lazy loading)

Each tool lives in `src/features/<tool>/` as an independent module with CSS isolation and on-demand loading.

## Adding a New Tool

1. Create `index.tsx` and `styles.css` under `src/features/<tool-name>/`
2. Use shared `tk-page`, `tk-btn` classes (or custom styles)
3. Add a lazy route in `src/App.tsx`
4. Add card data in `src/data/tools.ts`
