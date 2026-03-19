import GithubSlugger from "github-slugger";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export type TocItem = {
  id: string;
  level: number;
  text: string;
};

type LooseNode = {
  type?: string;
  depth?: number;
  value?: string;
  alt?: string;
  children?: LooseNode[];
};

function nodeToText(node: LooseNode | LooseNode[] | undefined): string {
  if (!node) {
    return "";
  }

  if (Array.isArray(node)) {
    return node.map((item) => nodeToText(item)).join("");
  }

  if (node.type === "text" || node.type === "inlineCode" || node.type === "code") {
    return node.value ?? "";
  }

  if (node.type === "image") {
    return node.alt ?? "";
  }

  return nodeToText(node.children);
}

export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as LooseNode;
  const toc: TocItem[] = [];

  visit(tree as never, "heading", (node: LooseNode) => {
    const level = node.depth ?? 0;
    if (level < 1 || level > 3) {
      return;
    }

    const text = nodeToText(node.children).trim();
    if (!text) {
      return;
    }

    toc.push({
      id: slugger.slug(text),
      level,
      text,
    });
  });

  return toc;
}
