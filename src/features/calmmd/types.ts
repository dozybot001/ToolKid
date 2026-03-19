import type { TocItem } from "./lib/markdown";

export type ThemeMode = "light" | "dark";
export type ViewMode = "preview" | "source";
export type WidthMode = "focused" | "relaxed";

export type DocumentState = {
  documentKey: string;
  fileName: string;
  markdown: string;
  toc: TocItem[];
};

export type FocusedImage = {
  src: string;
  alt: string;
  caption: string;
};

export type RecentDocument = {
  documentKey: string;
  fileName: string;
  markdown: string;
  lastOpenedAt: number;
};
