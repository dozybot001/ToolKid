import type { CSSProperties } from "react";
import type { TocItem } from "../lib/markdown";

type TocListProps = {
  items: TocItem[];
  activeHeadingId: string;
  emptyMessage: string;
  onSelect: (id: string) => void;
  registerItem?: (id: string, element: HTMLButtonElement | null) => void;
  mobile?: boolean;
};

export default function TocList({
  items,
  activeHeadingId,
  emptyMessage,
  onSelect,
  registerItem,
  mobile = false,
}: TocListProps) {
  if (items.length === 0) {
    return <p className="toc-panel__empty">{emptyMessage}</p>;
  }

  const content = items.map((item) => {
    const levelStyle = { "--level": item.level } as CSSProperties;

    return mobile ? (
      <button
        key={item.id}
        className={`toc-link${activeHeadingId === item.id ? " is-active" : ""}`}
        style={levelStyle}
        onClick={() => onSelect(item.id)}
      >
        {item.text}
      </button>
    ) : (
      <li key={item.id}>
        <button
          ref={(element) => registerItem?.(item.id, element)}
          className={`toc-link${activeHeadingId === item.id ? " is-active" : ""}`}
          style={levelStyle}
          onClick={() => onSelect(item.id)}
        >
          {item.text}
        </button>
      </li>
    );
  });

  if (mobile) {
    return <div className="mobile-toc__content">{content}</div>;
  }

  return (
    <nav aria-label="文稿结构">
      <ul className="toc-list">{content}</ul>
    </nav>
  );
}
