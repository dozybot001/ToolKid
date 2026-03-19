import { useState, useEffect, useCallback, useRef } from 'react';
import BackNav from '../../components/BackNav';
import './styles.css';

const PRESETS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#ffffff', '#000000',
];

function isValidHex(c: string) {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(c);
}

function randomHex() {
  return '#' + Array.from({ length: 6 }, () =>
    '0123456789ABCDEF'[Math.floor(Math.random() * 16)]
  ).join('');
}

function contrastText(hex: string) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#000' : '#fff';
}

export default function PureColor() {
  const [color, setColor] = useState('#3498db');
  const [hex, setHex] = useState('#3498db');
  const [fullscreen, setFullscreen] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);

  const update = useCallback((c: string) => {
    const v = c.startsWith('#') ? c : '#' + c;
    setColor(v);
    setHex(v);
  }, []);

  const onHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHex(e.target.value);
    if (isValidHex(e.target.value)) {
      const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
      setColor(v);
    }
  };

  const onHexBlur = () => { if (!isValidHex(hex)) setHex(color); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="pure-color-root tk-page tk-page--narrow">
      <BackNav />
      <div className="tk-page-header">
        <h1 className="tk-page-title">Pure Color</h1>
        <p className="tk-page-subtitle">选择颜色并全屏展示，适合屏幕检测或拍照背景</p>
      </div>

      <div className="pc-body">
        <div
          className="pc-preview"
          style={{ backgroundColor: color }}
          onClick={() => pickerRef.current?.click()}
        />

        <div className="tk-surface tk-row" style={{ maxWidth: 360, width: '100%' }}>
          <input
            ref={pickerRef}
            type="color"
            className="pc-color-native"
            value={color}
            onChange={(e) => update(e.target.value)}
          />
          <input
            type="text"
            className="tk-input tk-input--mono"
            value={hex}
            onChange={onHexChange}
            onBlur={onHexBlur}
            maxLength={7}
            spellCheck={false}
          />
        </div>

        <div className="pc-presets">
          {PRESETS.map((c) => (
            <button
              key={c}
              className={`pc-preset${c === color ? ' pc-preset--active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => update(c)}
            />
          ))}
        </div>

        <div className="pc-actions">
          <button className="tk-btn" onClick={() => setFullscreen(true)}>全屏展示</button>
          <button className="tk-btn" onClick={() => update(randomHex())}>随机颜色</button>
        </div>
      </div>

      {fullscreen && (
        <div className="pc-fullscreen" style={{ backgroundColor: color }}>
          <div className="pc-fs-controls">
            <span className="pc-fs-label" style={{ color: contrastText(color) }}>
              {color.toUpperCase()}
            </span>
            <button
              className="pc-fs-exit"
              style={{ color: contrastText(color), borderColor: contrastText(color) + '33' }}
              onClick={() => setFullscreen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="4" y1="4" x2="14" y2="14" />
                <line x1="14" y1="4" x2="4" y2="14" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
