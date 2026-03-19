import type { RecentDocument } from "../types";

function getRecentDocumentType(fileName: string): "md" | "txt" | "file" {
  if (/\.txt$/i.test(fileName)) {
    return "txt";
  }

  if (/\.(md|markdown)$/i.test(fileName)) {
    return "md";
  }

  return "file";
}

function getRecentDocumentDisplayName(fileName: string): string {
  return fileName.replace(/\.(md|markdown|txt)$/i, "");
}

type RecentDocumentType = "md" | "txt" | "file";

function RecentDocumentIcon({ type }: { type: RecentDocumentType }) {
  const label = type === "file" ? "FILE" : type.toUpperCase();

  return (
    <span className="recent-documents__icon" aria-hidden="true">
      <svg
        className="recent-documents__icon-mark"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.25 1.75H9.5L12.75 5V12.75C12.75 13.4404 12.1904 14 11.5 14H4.5C3.80964 14 3.25 13.4404 3.25 12.75V3C3.25 2.30964 3.80964 1.75 4.5 1.75H4.25Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M9.25 1.75V5.25H12.75"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span className="recent-documents__icon-text">{label}</span>
    </span>
  );
}

type RecentDocumentsProps = {
  documents: RecentDocument[];
  currentDocumentKey: string;
  onOpen: (documentKey: string) => void;
  onRemove?: (documentKey: string) => void;
  onClearAll?: () => void;
  mobile?: boolean;
};

export default function RecentDocuments({
  documents,
  currentDocumentKey,
  onOpen,
  onRemove,
  onClearAll,
  mobile = false,
}: RecentDocumentsProps) {
  const visibleDocuments = documents
    .filter((document) => document.documentKey !== currentDocumentKey)
    .slice(0, mobile ? 3 : 4);

  if (visibleDocuments.length === 0) {
    return null;
  }

  return (
    <section
      className={`recent-documents${mobile ? " recent-documents--mobile" : ""}`}
      aria-label="最近打开"
    >
      {mobile ? (
        <div className="recent-documents__header">
          <p className="recent-documents__label">最近打开</p>
          {onClearAll ? (
            <button
              type="button"
              className="recent-documents__clear-all"
              onClick={onClearAll}
              aria-label="清空最近打开"
            >
              清空
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="recent-documents__list">
        {visibleDocuments.map((document) => {
          const fileType = getRecentDocumentType(document.fileName);
          const displayName = getRecentDocumentDisplayName(document.fileName);

          return (
            <div key={document.documentKey} className="recent-documents__item-row">
              <button
                type="button"
                className="recent-documents__item"
                title={document.fileName}
                onClick={() => onOpen(document.documentKey)}
              >
                <RecentDocumentIcon type={fileType} />
                <span className="recent-documents__file-name">{displayName}</span>
              </button>
              {onRemove ? (
                <button
                  type="button"
                  className="recent-documents__remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(document.documentKey);
                  }}
                  aria-label={`移除 ${document.fileName}`}
                  title="移除"
                >
                  <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
                    <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {!mobile && onClearAll ? (
        <button
          type="button"
          className="recent-documents__clear-all"
          onClick={onClearAll}
          aria-label="清空最近打开"
        >
          清空记录
        </button>
      ) : null}
    </section>
  );
}
