import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

type SearchableContentProps = {
  contentVersion: string;
  query: string;
  activeMatchIndex: number;
  onMatchCountChange: (count: number) => void;
  children: ReactNode;
};

function clearSearchHighlights(root: HTMLElement) {
  const highlights = Array.from(root.querySelectorAll<HTMLElement>(".search-hit"));

  for (const highlight of highlights) {
    const parent = highlight.parentNode;
    if (!parent) {
      continue;
    }

    parent.replaceChild(
      document.createTextNode(highlight.textContent ?? ""),
      highlight,
    );
    parent.normalize();
  }
}

function collectSearchableTextNodes(root: HTMLElement): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Text)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (!node.textContent?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;
      if (!parent) {
        return NodeFilter.FILTER_REJECT;
      }

      if (parent.closest("[data-search-ignore='true']")) {
        return NodeFilter.FILTER_REJECT;
      }

      if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let currentNode = walker.nextNode();

  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  return textNodes;
}

function highlightSearchMatches(root: HTMLElement, query: string): number {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return 0;
  }

  const textNodes = collectSearchableTextNodes(root);
  let matchCount = 0;

  for (const textNode of textNodes) {
    const sourceText = textNode.textContent ?? "";
    const normalizedText = sourceText.toLocaleLowerCase();
    let searchIndex = normalizedText.indexOf(normalizedQuery);

    if (searchIndex === -1) {
      continue;
    }

    const fragment = document.createDocumentFragment();
    let cursor = 0;

    while (searchIndex !== -1) {
      if (searchIndex > cursor) {
        fragment.append(sourceText.slice(cursor, searchIndex));
      }

      const matchEnd = searchIndex + normalizedQuery.length;
      const highlight = document.createElement("mark");
      highlight.className = "search-hit";
      highlight.dataset.searchHitIndex = String(matchCount);
      highlight.textContent = sourceText.slice(searchIndex, matchEnd);
      fragment.append(highlight);

      matchCount += 1;
      cursor = matchEnd;
      searchIndex = normalizedText.indexOf(normalizedQuery, cursor);
    }

    if (cursor < sourceText.length) {
      fragment.append(sourceText.slice(cursor));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  }

  return matchCount;
}

export default function SearchableContent({
  contentVersion,
  query,
  activeMatchIndex,
  onMatchCountChange,
  children,
}: SearchableContentProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    clearSearchHighlights(root);

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      onMatchCountChange(0);
      return;
    }

    const matchCount = highlightSearchMatches(root, normalizedQuery);
    onMatchCountChange(matchCount);

    return () => {
      clearSearchHighlights(root);
    };
  }, [contentVersion, onMatchCountChange, query]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const highlights = Array.from(root.querySelectorAll<HTMLElement>(".search-hit"));
    for (const highlight of highlights) {
      highlight.classList.remove("is-active");
    }

    if (activeMatchIndex < 0 || activeMatchIndex >= highlights.length) {
      return;
    }

    const activeHighlight = highlights[activeMatchIndex];
    activeHighlight.classList.add("is-active");
    activeHighlight.scrollIntoView({
      block: "center",
      inline: "nearest",
    });
  }, [activeMatchIndex, contentVersion, query]);

  return (
    <div ref={rootRef} className="search-scope">
      {children}
    </div>
  );
}
