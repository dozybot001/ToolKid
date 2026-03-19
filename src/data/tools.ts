export interface Tool {
  id: string
  name: string
  subtitle: string
  description: string
  path: string
  accent: string
  tags: string[]
  icon: string
}

/** 有自己风格的独立工具，首页展示为大卡片 + 风格化背景 */
export const featuredTools: Tool[] = [
  {
    id: 'calmmd',
    name: 'CalmMD',
    subtitle: 'Markdown 阅读器',
    description: '专注阅读体验的本地 Markdown 渲染器，支持 LaTeX、Mermaid、目录导航',
    path: '/calmmd',
    accent: '#8B7355',
    tags: ['React', 'TypeScript', 'PWA'],
    icon: '📖',
  },
  {
    id: 'translator',
    name: 'Translator',
    subtitle: 'PDF 多模型翻译',
    description: '多 AI 模型协作的 PDF 翻译工具，支持学术/文学/技术多种模式',
    path: '/translator',
    accent: '#9B9B9B',
    tags: ['React', 'AI', 'PDF'],
    icon: '🌐',
  },
]

/** 统一风格的小工具，首页展示为紧凑行 */
export const miniTools: Tool[] = [
  {
    id: 'quizgo',
    name: 'QuizGo',
    subtitle: '闪卡复习',
    description: '沉浸式闪卡，支持公式与代码',
    path: '/quizgo',
    accent: '#c9a87a',
    tags: [],
    icon: '🃏',
  },
  {
    id: 'auto-space',
    name: 'Auto Space',
    subtitle: '中英文加空格',
    description: '自动在中英文之间插入空格',
    path: '/auto-space',
    accent: '#c9a87a',
    tags: [],
    icon: '🔤',
  },
  {
    id: 'pure-color',
    name: 'Pure Color',
    subtitle: '全屏纯色',
    description: '全屏纯色显示，屏幕测试',
    path: '/pure-color',
    accent: '#c9a87a',
    tags: [],
    icon: '🎨',
  },
  {
    id: 'fetch-readme',
    name: 'Fetch README',
    subtitle: '批量下载 README',
    description: '下载 GitHub 用户所有仓库 README',
    path: '/fetch-readme',
    accent: '#c9a87a',
    tags: [],
    icon: '📥',
  },
  {
    id: 'prompt-amp',
    name: 'Prompt Amplifier',
    subtitle: 'Prompt 放大器',
    description: '将粗略想法通过 3 轮 AI 分析，扩展为可编辑的结构化详细规格',
    path: '/prompt-amp',
    accent: '#c9a87a',
    tags: [],
    icon: '🔬',
  },
  {
    id: 'file-size-chart',
    name: 'File Size',
    subtitle: '文件大小分析',
    description: '可视化文件夹大小分布',
    path: '/file-size-chart',
    accent: '#c9a87a',
    tags: [],
    icon: '📊',
  },
]
