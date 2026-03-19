import type { RefObject } from "react";
import type {
  ThemeMode,
  ViewMode,
  WidthMode,
} from "../types";

type ReaderControlsProps = {
  controlSurfaceRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  isSearchOpen: boolean;
  fileName: string;
  sectionsCount: number;
  readingMinutes: number;
  viewMode: ViewMode;
  widthMode: WidthMode;
  theme: ThemeMode;
  onToggleOpen: () => void;
  onToggleSearch: () => void;
  onOpenFilePicker: () => void;
  onToggleViewMode: () => void;
  onToggleWidthMode: () => void;
  onToggleTheme: () => void;
};

export default function ReaderControls({
  controlSurfaceRef,
  isOpen,
  isSearchOpen,
  fileName,
  sectionsCount,
  readingMinutes,
  viewMode,
  widthMode,
  theme,
  onToggleOpen,
  onToggleSearch,
  onOpenFilePicker,
  onToggleViewMode,
  onToggleWidthMode,
  onToggleTheme,
}: ReaderControlsProps) {
  return (
    <div
      ref={controlSurfaceRef}
      className={`control-surface${isOpen ? " is-open" : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="control-surface__trigger"
        aria-label={isOpen ? "收起阅读选项" : "展开阅读选项"}
        aria-expanded={isOpen}
        aria-controls="control-surface-panel"
        onClick={onToggleOpen}
      >
        <span className="control-surface__brand">CALMMD</span>
        <span className="control-surface__icon-shell" aria-hidden="true">
          <svg
            className="control-surface__chevron"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.25 5.5L12.25 10L7.25 14.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <div
        id="control-surface-panel"
        className="control-surface__panel"
        aria-hidden={!isOpen}
      >
        <div className="control-surface__panel-body">
          <div className="info-capsule info-capsule--panel" title={fileName}>
            <span className="info-capsule__file">{fileName}</span>
            <span className="info-capsule__meta">
              {sectionsCount} 段 · {readingMinutes} 分钟
            </span>
          </div>

          <div className="control-surface__controls">
            <button
              className="button button--pill"
              onClick={onOpenFilePicker}
            >
              导入
            </button>

            <button
              className={`button button--pill${isSearchOpen ? " is-active" : ""}`}
              aria-label={isSearchOpen ? "关闭文内搜索" : "打开文内搜索"}
              onClick={onToggleSearch}
            >
              搜索
            </button>

            <button
              className="button button--pill"
              aria-label={viewMode === "preview" ? "切换到原文视图" : "切换到阅读视图"}
              onClick={onToggleViewMode}
            >
              {viewMode === "preview" ? "原文" : "阅读"}
            </button>

            <button
              className="button button--pill"
              aria-label={widthMode === "focused" ? "切换到舒展宽度" : "切换到专注宽度"}
              onClick={onToggleWidthMode}
            >
              {widthMode === "focused" ? "舒展" : "专注"}
            </button>

            <button
              className="button button--pill"
              aria-label={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
              onClick={onToggleTheme}
            >
              {theme === "light" ? "深色" : "浅色"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
