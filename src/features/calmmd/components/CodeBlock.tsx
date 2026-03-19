import { useEffect, useState } from "react";

type CodeBlockProps = {
  code: string;
  className?: string;
};

function formatLanguageLabel(className?: string): string {
  const normalized = className?.replace(/^language-/, "").trim();
  if (!normalized) {
    return "TEXT";
  }

  return normalized.toUpperCase();
}

export default function CodeBlock({ code, className }: CodeBlockProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const languageLabel = formatLanguageLabel(className);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="code-block">
      <div className="code-block__header" data-search-ignore="true">
        <span className="code-block__language">{languageLabel}</span>
        <button
          type="button"
          className="code-block__copy"
          aria-live="polite"
          onClick={() => {
            void handleCopy();
          }}
        >
          {copyState === "copied"
            ? "已复制"
            : copyState === "failed"
              ? "复制失败"
              : "复制"}
        </button>
      </div>
      <pre className="code-block__pre">
        <code className={className}>{code}</code>
      </pre>
    </div>
  );
}
