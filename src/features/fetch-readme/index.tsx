import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import BackNav from '../../components/BackNav';
import './styles.css';

function parseOwner(input: string): string | null {
  const trimmed = input.trim();
  // Direct username
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  // GitHub URL
  const match = trimmed.match(/github\.com\/([^/\s]+)/);
  return match ? match[1] : null;
}

function decodeBase64UTF8(base64: string): string {
  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

interface Readme {
  repo: string;
  filename: string;
  content: string;
}

async function fetchAllReadmes(
  owner: string,
  onProgress: (msg: string) => void,
): Promise<Readme[]> {
  // Fetch repos
  const repos: { name: string; full_name: string }[] = [];
  let page = 1;
  for (;;) {
    const res = await fetch(
      `https://api.github.com/users/${owner}/repos?type=public&per_page=100&page=${page}&sort=updated`,
      { headers: { Accept: 'application/vnd.github.v3+json' } },
    );
    if (!res.ok) {
      if (res.status === 404) throw new Error(`用户 "${owner}" 不存在`);
      if (res.status === 403) throw new Error('GitHub API 频率限制，请稍后再试');
      throw new Error(`GitHub API 错误: ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    repos.push(...data.map((r: { name: string; full_name: string }) => ({ name: r.name, full_name: r.full_name })));
    if (data.length < 100) break;
    page++;
  }

  if (repos.length === 0) throw new Error(`${owner} 没有公开仓库`);
  onProgress(`找到 ${repos.length} 个仓库，正在获取 README…`);

  // Fetch READMEs with concurrency
  const names = ['README.md', 'README.txt', 'README', 'readme.md'];
  const readmes: Readme[] = [];
  const batch = 5;

  for (let i = 0; i < repos.length; i += batch) {
    const chunk = repos.slice(i, i + batch);
    const results = await Promise.all(
      chunk.map(async (repo) => {
        for (const name of names) {
          try {
            const res = await fetch(
              `https://api.github.com/repos/${repo.full_name}/contents/${name}`,
              { headers: { Accept: 'application/vnd.github.v3+json' } },
            );
            if (!res.ok) continue;
            const d = await res.json();
            if (d.type === 'file' && d.content) {
              return { repo: repo.name, filename: name, content: decodeBase64UTF8(d.content) };
            }
          } catch { /* skip */ }
        }
        return null;
      }),
    );
    readmes.push(...results.filter((r): r is Readme => r !== null));
    onProgress(`已获取 ${readmes.length} 个 README（${Math.min(i + batch, repos.length)}/${repos.length}）`);
    if (i + batch < repos.length) await new Promise((r) => setTimeout(r, 200));
  }

  return readmes;
}

async function downloadZip(readmes: Readme[], owner: string) {
  const zip = new JSZip();
  readmes.forEach(({ repo, filename, content }) => {
    zip.file(`${repo}-${filename}`, content);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').replace(/\..+/, '');
  a.download = `${owner}-readmes-${ts}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function FetchReadme() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = useCallback(async () => {
    const owner = parseOwner(input);
    if (!owner) {
      setError('请输入 GitHub 用户名或主页链接');
      return;
    }

    setError('');
    setLoading(true);
    setStatus('正在获取仓库列表…');

    try {
      const readmes = await fetchAllReadmes(owner, setStatus);
      if (readmes.length === 0) {
        setStatus('未找到任何 README 文件');
        return;
      }
      setStatus(`正在打包 ${readmes.length} 个文件…`);
      await downloadZip(readmes, owner);
      setStatus(`完成！已下载 ${readmes.length} 个 README`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
      setStatus('');
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <div className="fetch-readme-root tk-page tk-page--narrow">
      <BackNav />
      <div className="tk-page-header">
        <h1 className="tk-page-title">Fetch README</h1>
        <p className="tk-page-subtitle">批量下载某个 GitHub 用户所有公开仓库的 README，打包为 ZIP</p>
      </div>

      <div className="fr-input-row">
        <input
          className="tk-input"
          type="text"
          placeholder="GitHub 用户名或主页链接"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleFetch(); }}
          spellCheck={false}
        />
        <button className="tk-btn" onClick={handleFetch} disabled={loading}>
          {loading ? '获取中…' : '获取'}
        </button>
      </div>

      {error && <p className="fr-error">{error}</p>}
      {status && <p className="fr-status">{status}</p>}
    </div>
  );
}
