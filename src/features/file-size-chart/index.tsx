import { useState, useCallback, useRef, useEffect } from 'react';
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';
import BackNav from '../../components/BackNav';
import './styles.css';

Chart.register(DoughnutController, ArcElement, Tooltip);

const GITHUB_MAX = 100 * 1024 * 1024;

interface FileEntry {
  path: string;
  name: string;
  size: number;
}

interface ChartItem {
  label: string;
  path: string | null;
  size: number;
  isOther: boolean;
  count?: number;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return bytes + ' B';
}

const COLORS = [
  '#5b8bd4', '#d4785b', '#5bd49b', '#d4c45b', '#9b5bd4',
  '#5bc4d4', '#d4985b', '#d45ba0', '#5bd4bf', '#a0d45b',
  '#c45bd4', '#d4b85b', '#5b9bd4', '#d45b6e', '#6ed45b',
  '#d45bca',
];

async function scanFolder(
  dir: FileSystemDirectoryHandle,
  base = '',
): Promise<FileEntry[]> {
  const files: FileEntry[] = [];
  for await (const entry of (dir as any).values()) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const entryPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.kind === 'file') {
      try {
        const f = await entry.getFile();
        files.push({ path: entryPath, name: entry.name, size: f.size });
      } catch { /* skip */ }
    } else if (entry.kind === 'directory') {
      const sub = await scanFolder(entry as FileSystemDirectoryHandle, entryPath);
      files.push(...sub);
    }
  }
  return files;
}

function buildChartData(files: FileEntry[], topPercent = 0.99): ChartItem[] {
  const sorted = [...files].sort((a, b) => b.size - a.size);
  const total = sorted.reduce((s, f) => s + f.size, 0);
  const target = total * topPercent;

  let cum = 0;
  const top: ChartItem[] = [];
  const rest: FileEntry[] = [];

  for (const f of sorted) {
    if (cum < target) {
      top.push({ label: f.name, path: f.path, size: f.size, isOther: false });
      cum += f.size;
    } else {
      rest.push(f);
    }
  }

  if (rest.length > 0) {
    top.push({
      label: 'OTHER',
      path: null,
      size: rest.reduce((s, f) => s + f.size, 0),
      isOther: true,
      count: rest.length,
    });
  }

  return top;
}

export default function FileSizeChart() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const handleSelect = useCallback(async () => {
    try {
      const dir = await (window as any).showDirectoryPicker({ mode: 'read' });
      setError('');
      setLoading(true);
      setFolderName(dir.name);
      const result = await scanFolder(dir);
      if (result.length === 0) {
        setError('文件夹为空');
        setFiles([]);
      } else {
        setFiles(result);
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setError(e?.message || '无法读取文件夹');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const chartData = files.length > 0 ? buildChartData(files) : [];
  const totalSize = files.reduce((s, f) => s + f.size, 0);

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || chartData.length === 0) return;

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: chartData.map((d) => d.label),
        datasets: [{
          data: chartData.map((d) => d.size),
          backgroundColor: chartData.map((_, i) => COLORS[i % COLORS.length]),
          borderColor: '#0e0e12',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          tooltip: {
            backgroundColor: '#1a1a22',
            titleColor: '#e0e0e6',
            bodyColor: '#7a7a8a',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed || 0;
                return `${ctx.label}: ${formatSize(v)} (${((v / totalSize) * 100).toFixed(1)}%)`;
              },
            },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [chartData, totalSize]);

  return (
    <div className="file-size-chart-root tk-page tk-page--narrow">
      <BackNav />
      <div className="tk-page-header">
        <h1 className="tk-page-title">File Size Chart</h1>
        <p className="tk-page-subtitle">可视化分析本地文件夹大小，标出超过 GitHub 100MB 限制的文件</p>
      </div>

      <div className="fsc-action">
        <button className="tk-btn" onClick={handleSelect} disabled={loading}>
          {loading ? '扫描中…' : '选择文件夹'}
        </button>
        {folderName && !loading && (
          <span className="fsc-folder-name">{folderName} — {files.length} 个文件，共 {formatSize(totalSize)}</span>
        )}
      </div>

      {error && <p className="fsc-error">{error}</p>}

      {chartData.length > 0 && (
        <>
          <div className="fsc-chart-wrap">
            <canvas ref={canvasRef} />
          </div>

          <div className="fsc-list">
            {chartData.map((item, i) => (
              <div
                key={item.label + i}
                className={`fsc-list-item${!item.isOther && item.size >= GITHUB_MAX ? ' fsc-list-item--warn' : ''}`}
              >
                <span className="fsc-dot" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="fsc-list-name" title={item.path || undefined}>{item.label}</span>
                {!item.isOther && item.size >= GITHUB_MAX && <span className="fsc-list-badge">≥100MB</span>}
                {item.isOther && item.count && <span className="fsc-list-count">{item.count} 个文件</span>}
                <span className="fsc-list-size">{formatSize(item.size)}</span>
                <span className="fsc-list-pct">{((item.size / totalSize) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>

          <p className="tk-hint" style={{ marginTop: 16 }}>
            纯本地扫描，不上传任何文件。仅需 Chromium 内核浏览器。
          </p>
        </>
      )}
    </div>
  );
}
