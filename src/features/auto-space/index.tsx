import { useState, useCallback } from 'react';
import BackNav from '../../components/BackNav';
import './styles.css';

/* ── Unicode spacing logic (from text-autospace.js) ── */

const latin = String.raw`[A-Za-z0-9\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]`;
const puncMid = String.raw`[@&=_,.\?!\$%\^\*\-\+\/]`;
const puncOpen = String.raw`[(\['"<\u2018\u201C]`;
const puncClose = String.raw`[)\]'">\u2019\u201D]`;

const hanzi = [
  String.raw`[\u4E00-\u9FFF]`,
  String.raw`[\u3400-\u4DB5\u9FA6-\u9FBB\uFA70-\uFAD9\u9FBC-\u9FC3\u3007\u3040-\u309E\u30A1-\u30FA\u30FD\u30FE\uFA0E-\uFA0F\uFA11\uFA13-\uFA14\uFA1F\uFA21\uFA23-\uFA24\uFA27-\uFA29]`,
].join('|');

const latinOrPunc = `${latin}|${puncMid}`;

const patterns: RegExp[] = [
  new RegExp(`(${hanzi})(${latinOrPunc}|${puncOpen})`, 'g'),
  new RegExp(`(${latinOrPunc}|${puncClose})(${hanzi})`, 'g'),
];

function autoSpace(text: string): string {
  let result = text;
  for (const p of patterns) result = result.replace(p, '$1 $2');
  return result;
}

/* ── Component ── */

export default function AutoSpace() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvert = useCallback(() => {
    setOutput(autoSpace(input));
  }, [input]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [output]);

  return (
    <div className="auto-space-root tk-page tk-page--narrow">
      <BackNav />
      <div className="tk-page-header">
        <h1 className="tk-page-title">Auto Space</h1>
        <p className="tk-page-subtitle">自动在中文和英文、数字、符号之间加上空格</p>
      </div>

      <div className="as-section">
        <label className="tk-label">输入</label>
        <textarea
          className="tk-textarea"
          placeholder="在此粘贴需要处理的文本…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="as-action-bar">
        <button className="tk-btn" onClick={handleConvert}>加上空格</button>
      </div>

      <div className="as-section">
        <div className="tk-row tk-row--between">
          <label className="tk-label" style={{ margin: 0 }}>输出</label>
          {output && (
            <button className="tk-btn--sm tk-btn--ghost" onClick={handleCopy}>
              {copied ? '已复制' : '复制'}
            </button>
          )}
        </div>
        <textarea
          className="tk-textarea as-output"
          value={output}
          readOnly
          onFocus={(e) => e.target.select()}
          placeholder="处理结果将显示在这里…"
        />
      </div>
    </div>
  );
}
