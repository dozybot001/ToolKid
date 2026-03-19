import React, { useState } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const [targetLanguage, setTargetLanguage] = useState<string>('English');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [modelNames, setModelNames] = useState<string[]>(['']);
  const [translationMode, setTranslationMode] = useState<string>('standard');

  const addModelName = (): void => {
    setModelNames([...modelNames, '']);
  };

  const removeModelName = (index: number): void => {
    if (modelNames.length > 1) {
      setModelNames(modelNames.filter((_, i) => i !== index));
    }
  };

  const updateModelName = (index: number, value: string): void => {
    const updated = [...modelNames];
    updated[index] = value;
    setModelNames(updated);
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button className="hamburger-button" onClick={onToggle}>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </button>

      <div className={`sidebar-content ${collapsed ? 'collapsed' : ''}`}>
        <div className="upload-area">
          <label htmlFor="pdf-upload" className="upload-label">
            <div className="upload-icon">📄</div>
            <div className="upload-text">Drop PDF file here or click to upload</div>
          </label>
          <input
            type="file"
            accept=".pdf"
            className="file-input"
            id="pdf-upload"
          />
        </div>

        <button className="translate-button">
          TRANSLATE
        </button>

        <div className="settings-section">
          <div className="settings-title">Settings</div>

          <div className="setting-item">
            <label className="setting-label">Target Language</label>
            <select
              className="setting-select"
              value={targetLanguage}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetLanguage(e.target.value)}
            >
              <option value="Chinese">Chinese</option>
              <option value="English">English</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>

          <div className="setting-item">
            <label className="setting-label">Translation Mode</label>
            <select
              className="setting-select"
              value={translationMode}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTranslationMode(e.target.value)}
            >
              <option value="standard">Standard</option>
              <option value="academic">Academic</option>
              <option value="literary">Literary</option>
              <option value="technical">Technical</option>
            </select>
          </div>

          <div className="setting-group">
            <div className="setting-group-title">API Configuration</div>

            <div className="setting-item">
              <label className="setting-label">Base URL</label>
              <input
                type="text"
                className="setting-input"
                placeholder="Enter base URL"
                value={baseUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseUrl(e.target.value)}
              />
            </div>

            <div className="setting-item">
              <label className="setting-label">API Key</label>
              <input
                type="text"
                className="setting-input"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
              />
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-group-title">Multi Agent for One Task</div>

            {modelNames.map((modelName: string, index: number) => (
              <div key={index} className="setting-item model-name-item">
                <div className="model-name-input-wrapper">
                  <input
                    type="text"
                    className="setting-input model-name-input"
                    placeholder="Enter model name"
                    value={modelName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateModelName(index, e.target.value)}
                  />
                  {modelNames.length > 1 && (
                    <button
                      type="button"
                      className="remove-model-button"
                      onClick={() => removeModelName(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              className="add-model-button"
              onClick={addModelName}
            >
              + Add Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
