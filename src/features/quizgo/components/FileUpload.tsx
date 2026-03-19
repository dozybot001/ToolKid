import { useCallback, useState } from 'react';
import BackNav from '../../../components/BackNav';

interface FileUploadProps {
  onFileLoaded: (content: string) => void;
  accept?: string;
}

export function FileUpload({ onFileLoaded, accept = '.json' }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file || !file.name.endsWith('.json')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') onFileLoaded(content);
      };
      reader.readAsText(file, 'UTF-8');
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target?.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  const handleClick = () => {
    document.getElementById('quizgo-file-input')?.click();
  };

  return (
    <div className="tk-page tk-page--narrow">
      <BackNav />
      <div className="tk-page-header">
        <h1 className="tk-page-title">QuizGo</h1>
        <p className="tk-page-subtitle">沉浸式闪卡复习，支持 Markdown、LaTeX 公式、代码块</p>
      </div>

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`file-upload ${isDragging ? 'file-upload--dragging' : ''}`}
      >
        <input
          id="quizgo-file-input"
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="file-upload__input"
        />

        <div className="file-upload__drop-zone">
          <svg
            className="file-upload__icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v12m0-12l-3 3m3-3l3 3"
            />
          </svg>
        </div>
        <p className="file-upload__title">
          {isDragging ? '松开上传' : '点击或拖放 .json 文件'}
        </p>
      </div>

      <div className="file-upload__format-guide">
        <p className="tk-label">文件格式</p>
        <pre className="tk-code">{
`[
  { "q": "问题", "a": "答案" },
  { "q": "...",  "a": "..." }
]`
        }</pre>
        <div className="file-upload__format-notes">
          <p><span className="file-upload__field">q</span> / <span className="file-upload__field">a</span> 必填，内容支持 Markdown、LaTeX 公式、代码块</p>
          <p><span className="file-upload__field">bg</span> 可选，补充背景信息</p>
        </div>
      </div>

      <p className="tk-hint" style={{ textAlign: 'center', marginTop: 32 }}>
        左键翻卡 · 右键回退 · 键盘方向键导航
      </p>
    </div>
  );
}
