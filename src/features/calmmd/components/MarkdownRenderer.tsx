import type {
  HTMLAttributes,
  AnchorHTMLAttributes,
  ImgHTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
} from "react";
import { Children, isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import CodeBlock from "./CodeBlock";
import MermaidBlock from "./MermaidBlock";
import type { FocusedImage } from "../types";

type MarkdownLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: ReactNode;
  node?: unknown;
};

type MarkdownImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  node?: unknown;
};

type MarkdownTableProps = TableHTMLAttributes<HTMLTableElement> & {
  children?: ReactNode;
  node?: unknown;
};

type MarkdownPreProps = HTMLAttributes<HTMLPreElement> & {
  children?: ReactNode;
  node?: unknown;
};

function extractNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  return Children.toArray(node)
    .map((child) => {
      if (!isValidElement(child)) {
        return "";
      }

      return extractNodeText(
        (child.props as { children?: ReactNode }).children,
      );
    })
    .join("");
}

function createMarkdownComponents(
  onOpenImage?: (image: FocusedImage) => void,
) {
  return {
    a: ({ href, children, ...props }: MarkdownLinkProps) => {
      const isExternal = Boolean(href?.startsWith("http"));

      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
          {...props}
        >
          {children}
        </a>
      );
    },
    img: ({ alt, src, title, node: _node, ...props }: MarkdownImageProps) => {
      const resolvedSrc = typeof src === "string" ? src : "";
      const resolvedAlt = alt ?? "";
      const caption = title ?? resolvedAlt;
      const openLabel = caption
        ? `查看大图：${caption}`
        : "查看大图";

      const image = (
        <img
          loading="lazy"
          alt={resolvedAlt}
          src={resolvedSrc}
          {...props}
        />
      );

      return (
        <figure className="image-block">
          {onOpenImage && resolvedSrc ? (
            <button
              type="button"
              className="image-block__button"
              aria-label={openLabel}
              onClick={() =>
                onOpenImage({
                  src: resolvedSrc,
                  alt: resolvedAlt,
                  caption,
                })
              }
            >
              {image}
            </button>
          ) : (
            image
          )}
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      );
    },
    table: ({ children, ...props }: MarkdownTableProps) => (
      <div className="table-scroll">
        <table {...props}>{children}</table>
      </div>
    ),
    pre: ({ children, ...props }: MarkdownPreProps) => {
      const child = Children.toArray(children)[0];

      if (isValidElement(child)) {
        const childProps = child.props as {
          className?: string;
          children?: ReactNode;
        };

        const code = extractNodeText(childProps.children);
        const isMermaid = childProps.className === "language-mermaid";

        if (isMermaid) {
          return <MermaidBlock code={code} />;
        }

        return (
          <CodeBlock
            className={childProps.className}
            code={code}
          />
        );
      }

      return <pre {...props}>{children}</pre>;
    },
  };
}

type MarkdownRendererProps = {
  markdown: string;
  onOpenImage?: (image: FocusedImage) => void;
};

export default function MarkdownRenderer({
  markdown,
  onOpenImage,
}: MarkdownRendererProps) {
  return (
    <article className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeSlug, rehypeKatex]}
        components={createMarkdownComponents(onOpenImage)}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
