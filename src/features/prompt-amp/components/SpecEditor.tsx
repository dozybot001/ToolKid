import type { SpecSection } from '../lib/types'

interface Props {
  sections: SpecSection[]
  onChange: (sections: SpecSection[]) => void
  streaming: boolean
}

export default function SpecEditor({ sections, onChange, streaming }: Props) {
  function updateSection(id: string, content: string) {
    onChange(sections.map((s) => (s.id === id ? { ...s, content } : s)))
  }

  function copyAll() {
    const text = sections.map((s) => `## ${s.title}\n${s.content}`).join('\n\n')
    navigator.clipboard.writeText(text)
  }

  if (sections.length === 0) return null

  return (
    <div className="pa-editor">
      <div className="pa-editor-header tk-row tk-row--between">
        <span className="tk-label" style={{ margin: 0 }}>生成结果</span>
        <button className="tk-btn tk-btn--sm" onClick={copyAll} disabled={streaming}>
          复制全部
        </button>
      </div>

      <div className="pa-sections">
        {sections.map((section) => (
          <div key={section.id} className="pa-section tk-surface">
            <div className="pa-section-title">{section.title}</div>
            <textarea
              className="pa-section-content"
              value={section.content}
              onChange={(e) => updateSection(section.id, e.target.value)}
              disabled={streaming}
              rows={Math.max(3, section.content.split('\n').length + 1)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
