import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "strict",
  fontFamily: "inherit",
});

type MermaidTheme = "dark" | "default";

function useCalmMDTheme(): MermaidTheme {
  const [theme, setTheme] = useState<MermaidTheme>(() => {
    const root = document.querySelector(".calmmd-root");
    return root?.getAttribute("data-theme") === "dark" ? "dark" : "default";
  });

  useEffect(() => {
    const root = document.querySelector(".calmmd-root");
    if (!root) return;

    const observer = new MutationObserver(() => {
      const next: MermaidTheme = root.getAttribute("data-theme") === "dark" ? "dark" : "default";
      setTheme(next);
    });

    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

type MermaidBlockProps = {
  code: string;
};

export default function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const uniqueId = `mermaid-${useId().replace(/:/g, "")}`;
  const theme = useCalmMDTheme();

  useEffect(() => {
    let cancelled = false;

    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: "strict",
      fontFamily: "inherit",
    });

    mermaid
      .render(uniqueId, code.trim())
      .then(({ svg: renderedSvg }) => {
        if (!cancelled) {
          setSvg(renderedSvg);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("图表渲染失败");
          setSvg("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, uniqueId, theme]);

  if (error) {
    return (
      <div className="mermaid-block mermaid-block--error">
        <p className="mermaid-block__error">{error}</p>
        <pre className="mermaid-block__source">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="mermaid-block mermaid-block--loading">
        <span className="mermaid-block__placeholder">加载图表…</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-block"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
