import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "strict",
  fontFamily: "inherit",
});

type MermaidBlockProps = {
  code: string;
};

export default function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const uniqueId = `mermaid-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    let cancelled = false;

    const theme =
      document.documentElement.dataset.theme === "dark" ? "dark" : "default";

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
  }, [code, uniqueId]);

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
