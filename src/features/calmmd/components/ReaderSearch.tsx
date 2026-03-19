import { useEffect, useRef } from "react";

type ReaderSearchProps = {
  isOpen: boolean;
  query: string;
  matchCount: number;
  activeMatchIndex: number;
  onQueryChange: (value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
};

function getSearchStatusText(
  query: string,
  matchCount: number,
  activeMatchIndex: number,
): string {
  if (!query.trim()) {
    return "在这份文稿里查找";
  }

  if (matchCount === 0) {
    return "没有找到相关内容";
  }

  return `${activeMatchIndex + 1} / ${matchCount}`;
}

export default function ReaderSearch({
  isOpen,
  query,
  matchCount,
  activeMatchIndex,
  onQueryChange,
  onPrevious,
  onNext,
  onClose,
}: ReaderSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <section className="reader-search" aria-label="文内搜索">
      <label className="reader-search__field">
        <span className="sr-only">搜索当前文稿</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="搜索标题、正文、代码块或表格"
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (event.shiftKey) {
                onPrevious();
                return;
              }

              onNext();
            }

            if (event.key === "Escape") {
              event.preventDefault();
              if (query) {
                onQueryChange("");
                return;
              }

              onClose();
            }
          }}
        />
      </label>

      <div className="reader-search__meta">
        <span aria-live="polite">
          {getSearchStatusText(query, matchCount, activeMatchIndex)}
        </span>
      </div>

      <div className="reader-search__actions" data-search-ignore="true">
        <button
          type="button"
          className="button button--quiet"
          disabled={matchCount === 0}
          onClick={onPrevious}
        >
          上一处
        </button>
        <button
          type="button"
          className="button button--quiet"
          disabled={matchCount === 0}
          onClick={onNext}
        >
          下一处
        </button>
        <button
          type="button"
          className="button button--quiet"
          onClick={onClose}
        >
          关闭
        </button>
      </div>
    </section>
  );
}
