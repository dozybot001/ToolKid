import { useState, useEffect } from 'react'
import type { ApiConfig } from '../lib/types'

const STORAGE_KEY = 'prompt-amp-api-config'

const defaults: ApiConfig = {
  endpoint: 'https://api.openai.com',
  apiKey: '',
  model: 'gpt-4o',
}

function load(): ApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

function save(config: ApiConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

interface Props {
  onChange: (config: ApiConfig) => void
}

export default function ApiSettings({ onChange }: Props) {
  const [config, setConfig] = useState(load)
  const [open, setOpen] = useState(!config.apiKey)

  useEffect(() => {
    onChange(config)
  }, [config, onChange])

  function update(patch: Partial<ApiConfig>) {
    const next = { ...config, ...patch }
    setConfig(next)
    save(next)
  }

  return (
    <div className="pa-settings">
      <button
        className="pa-settings-toggle tk-btn--ghost tk-btn--sm tk-btn"
        onClick={() => setOpen(!open)}
        type="button"
      >
        {open ? '收起设置 ▲' : 'API 设置 ▼'}
      </button>

      {open && (
        <div className="pa-settings-panel tk-surface">
          <div className="pa-settings-row">
            <label className="tk-label">Endpoint</label>
            <input
              className="tk-input"
              value={config.endpoint}
              onChange={(e) => update({ endpoint: e.target.value })}
              placeholder="https://api.openai.com"
              spellCheck={false}
            />
          </div>
          <div className="pa-settings-row">
            <label className="tk-label">API Key</label>
            <input
              className="tk-input"
              type="password"
              value={config.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
              placeholder="sk-..."
              spellCheck={false}
            />
          </div>
          <div className="pa-settings-row">
            <label className="tk-label">Model</label>
            <input
              className="tk-input"
              value={config.model}
              onChange={(e) => update({ model: e.target.value })}
              placeholder="gpt-4o"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
