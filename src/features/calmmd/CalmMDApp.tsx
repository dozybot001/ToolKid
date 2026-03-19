import {
  startTransition,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { DragEvent } from "react";
import { flushSync } from "react-dom";
import DropOverlay from "./components/DropOverlay";
import ImageLightbox from "./components/ImageLightbox";
import MarkdownRenderer from "./components/MarkdownRenderer";
import RecentDocuments from "./components/RecentDocuments";
import ReaderControls from "./components/ReaderControls";
import ReaderSearch from "./components/ReaderSearch";
import ReadingProgress from "./components/ReadingProgress";
import SearchableContent from "./components/SearchableContent";
import TocList from "./components/TocList";
import { WELCOME_MARKDOWN } from "./content/welcome";
import { extractToc } from "./lib/markdown";
import {
  initLaunchQueue,
  setFileLaunchHandler,
} from "./launchQueue";
import type {
  DocumentState,
  FocusedImage,
  RecentDocument,
  ThemeMode,
  ViewMode,
  WidthMode,
} from "./types";

const ACCEPTED_FILE_PATTERN = /\.(md|markdown|txt)$/i;
const THEME_STORAGE_KEY = "calmmd-theme";
const WIDTH_STORAGE_KEY = "calmmd-width";
const READING_STATE_STORAGE_KEY = "calmmd-reading-state";
const RECENT_DOCUMENTS_STORAGE_KEY = "calmmd-recent-documents";
const MAX_SAVED_DOCUMENTS = 18;
const MAX_RECENT_DOCUMENTS = 8;
const MAX_RECENT_DOCUMENT_CHARS = 280_000;
const MAX_RECENT_TOTAL_CHARS = 1_200_000;

type SavedReadingState = {
  scrollY: number;
  viewMode: ViewMode;
  updatedAt: number;
};

type InitialReaderSession = {
  documentState: DocumentState;
  viewMode: ViewMode;
  restoreScrollY: number | null;
};

type ThemeTransitionDocument = Document & {
  startViewTransition?: (
    callback: () => void | Promise<void>,
  ) => {
    finished: Promise<void>;
  };
};

function getHeadingAnchorOffset(): number {
  if (typeof window === "undefined") {
    return 96;
  }

  return window.innerWidth <= 760 ? 88 : 96;
}

function hashString(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function createDocumentKey(markdown: string, fileName: string): string {
  return `${fileName}:${hashString(markdown)}`;
}

function readStoredReadingStates(): Record<string, SavedReadingState> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(READING_STATE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const validStates: Record<string, SavedReadingState> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") {
        continue;
      }

      const candidate = value as Partial<SavedReadingState>;
      if (
        typeof candidate.scrollY !== "number" ||
        typeof candidate.updatedAt !== "number" ||
        (candidate.viewMode !== "preview" && candidate.viewMode !== "source")
      ) {
        continue;
      }

      validStates[key] = {
        scrollY: candidate.scrollY,
        viewMode: candidate.viewMode,
        updatedAt: candidate.updatedAt,
      };
    }

    return validStates;
  } catch {
    return {};
  }
}

function getSavedReadingState(documentKey: string): SavedReadingState | null {
  const savedStates = readStoredReadingStates();
  return savedStates[documentKey] ?? null;
}

function persistReadingState(documentKey: string, nextState: SavedReadingState) {
  if (typeof window === "undefined") {
    return;
  }

  const savedStates = readStoredReadingStates();
  savedStates[documentKey] = nextState;

  const trimmedStates = Object.fromEntries(
    Object.entries(savedStates)
      .sort((left, right) => right[1].updatedAt - left[1].updatedAt)
      .slice(0, MAX_SAVED_DOCUMENTS),
  );

  window.localStorage.setItem(
    READING_STATE_STORAGE_KEY,
    JSON.stringify(trimmedStates),
  );
}

function readStoredRecentDocuments(): RecentDocument[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_DOCUMENTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    const documents: RecentDocument[] = [];

    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const candidate = entry as Partial<RecentDocument>;
      if (
        typeof candidate.documentKey !== "string" ||
        typeof candidate.fileName !== "string" ||
        typeof candidate.markdown !== "string" ||
        typeof candidate.lastOpenedAt !== "number"
      ) {
        continue;
      }

      documents.push({
        documentKey: candidate.documentKey,
        fileName: candidate.fileName,
        markdown: candidate.markdown,
        lastOpenedAt: candidate.lastOpenedAt,
      });
    }

    return normalizeRecentDocuments(documents);
  } catch {
    return [];
  }
}

function normalizeRecentDocuments(documents: RecentDocument[]): RecentDocument[] {
  const dedupedDocuments = documents
    .filter((document) => document.markdown.length <= MAX_RECENT_DOCUMENT_CHARS)
    .sort((left, right) => right.lastOpenedAt - left.lastOpenedAt)
    .reduce<RecentDocument[]>((carry, document) => {
      if (carry.some((entry) => entry.documentKey === document.documentKey)) {
        return carry;
      }

      return [...carry, document];
    }, []);

  const trimmedDocuments: RecentDocument[] = [];
  let totalChars = 0;

  for (const document of dedupedDocuments) {
    if (trimmedDocuments.length >= MAX_RECENT_DOCUMENTS) {
      break;
    }

    if (totalChars + document.markdown.length > MAX_RECENT_TOTAL_CHARS) {
      continue;
    }

    trimmedDocuments.push(document);
    totalChars += document.markdown.length;
  }

  return trimmedDocuments;
}

function persistRecentDocuments(documents: RecentDocument[]): RecentDocument[] {
  const normalizedDocuments = normalizeRecentDocuments(documents);

  if (typeof window === "undefined") {
    return normalizedDocuments;
  }

  let nextDocuments = normalizedDocuments;

  while (nextDocuments.length > 0) {
    try {
      window.localStorage.setItem(
        RECENT_DOCUMENTS_STORAGE_KEY,
        JSON.stringify(nextDocuments),
      );
      return nextDocuments;
    } catch {
      nextDocuments = nextDocuments.slice(0, -1);
    }
  }

  try {
    window.localStorage.removeItem(RECENT_DOCUMENTS_STORAGE_KEY);
  } catch {
    return [];
  }

  return [];
}

function createDocumentState(markdown: string, fileName: string): DocumentState {
  return {
    documentKey: createDocumentKey(markdown, fileName),
    fileName,
    markdown,
    toc: extractToc(markdown),
  };
}

function createInitialReaderSession(): InitialReaderSession {
  const documentState = createDocumentState(
    WELCOME_MARKDOWN,
    "CalmMD 欢迎文稿.md",
  );
  const savedState = getSavedReadingState(documentState.documentKey);

  return {
    documentState,
    viewMode: savedState?.viewMode ?? "preview",
    restoreScrollY: savedState?.scrollY ?? null,
  };
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeToRoot(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.querySelector(".calmmd-root") as HTMLElement | null;
  if (root) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }
}

function getInitialWidth(): WidthMode {
  if (typeof window === "undefined") {
    return "focused";
  }

  const saved = window.localStorage.getItem(WIDTH_STORAGE_KEY);
  return saved === "relaxed" ? "relaxed" : "focused";
}

function estimateReadingMinutes(markdown: string): number {
  const normalizedLength = markdown.replace(/\s+/g, "").length;
  return Math.max(1, Math.round(normalizedLength / 450));
}

function calculateReadingProgress(container: HTMLElement): number {
  const rect = container.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  if (rect.height <= 0) {
    return 0;
  }

  if (rect.bottom <= viewportHeight - 24) {
    return 1;
  }

  const absoluteTop = rect.top + window.scrollY;
  const traveled = window.scrollY + getHeadingAnchorOffset() - absoluteTop;
  const maxTravel = Math.max(1, rect.height - viewportHeight * 0.45);

  return Math.min(1, Math.max(0, traveled / maxTravel));
}

function isAcceptedFile(file: File): boolean {
  return ACCEPTED_FILE_PATTERN.test(file.name);
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export default function App() {
  const [initialReaderSession] = useState(createInitialReaderSession);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [widthMode, setWidthMode] = useState<WidthMode>(getInitialWidth);
  const [viewMode, setViewMode] = useState<ViewMode>(initialReaderSession.viewMode);
  const [documentState, setDocumentState] = useState<DocumentState>(
    () => initialReaderSession.documentState,
  );
  const [activeHeadingId, setActiveHeadingId] = useState<string>(
    initialReaderSession.documentState.toc[0]?.id ?? "",
  );
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingScrollId, setPendingScrollId] = useState("");
  const [pendingRestoreScrollY, setPendingRestoreScrollY] = useState<number | null>(
    initialReaderSession.restoreScrollY,
  );
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchCount, setSearchMatchCount] = useState(0);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [readingProgress, setReadingProgress] = useState(0);
  const [focusedImage, setFocusedImage] = useState<FocusedImage | null>(null);
  const [recentDocuments, setRecentDocuments] = useState(readStoredRecentDocuments);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadFileRef = useRef<(file: File | null) => void>(() => {});
  const controlSurfaceRef = useRef<HTMLDivElement | null>(null);
  const tocPanelRef = useRef<HTMLDivElement | null>(null);
  const documentBodyRef = useRef<HTMLDivElement | null>(null);
  const tocItemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const activeHeadingLockRef = useRef("");
  const dragDepthRef = useRef(0);
  const isRestoringPositionRef = useRef(
    initialReaderSession.restoreScrollY !== null,
  );
  const deferredMarkdown = useDeferredValue(documentState.markdown);
  const readingMinutes = estimateReadingMinutes(documentState.markdown);
  const sectionsCount = documentState.toc.length;
  const progressPercent = Math.max(0, Math.min(100, Math.round(readingProgress * 100)));
  const searchableContentVersion =
    `${viewMode}:${viewMode === "preview" ? deferredMarkdown : documentState.markdown}`;

  useLayoutEffect(() => {
    applyThemeToRoot(theme);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(WIDTH_STORAGE_KEY, widthMode);
  }, [widthMode]);

  useEffect(() => {
    activeHeadingLockRef.current = "";
    setActiveHeadingId(documentState.toc[0]?.id ?? "");
  }, [documentState.toc]);

  useEffect(() => {
    setFileLaunchHandler((file) => loadFileRef.current?.(file));
    initLaunchQueue();
    return () => setFileLaunchHandler(null);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatchCount(0);
      setActiveSearchIndex(-1);
      return;
    }

    setActiveSearchIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (searchMatchCount === 0) {
      setActiveSearchIndex(-1);
      return;
    }

    setActiveSearchIndex((current) =>
      current < 0 || current >= searchMatchCount ? 0 : current,
    );
  }, [searchMatchCount]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const usesCommandKey = event.ctrlKey || event.metaKey;
      const usesActionChord =
        usesCommandKey && event.altKey && !event.shiftKey;

      if (event.key === "Escape" && focusedImage) {
        event.preventDefault();
        setFocusedImage(null);
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setIsControlsOpen(false);
        setIsSearchOpen(true);
        return;
      }

      if (usesActionChord && key === "v") {
        event.preventDefault();
        setIsControlsOpen(false);
        setViewMode((current) =>
          current === "preview" ? "source" : "preview",
        );
        return;
      }

      if (usesActionChord && key === "w") {
        event.preventDefault();
        setWidthMode((current) =>
          current === "focused" ? "relaxed" : "focused",
        );
        return;
      }

      if (usesActionChord && key === "t") {
        event.preventDefault();
        toggleTheme();
        return;
      }

      if (event.key === "Escape") {
        if (isControlsOpen) {
          setIsControlsOpen(false);
        }

        if (isSearchOpen && !searchQuery.trim()) {
          setIsSearchOpen(false);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusedImage, isControlsOpen, isSearchOpen, searchQuery, theme]);

  useEffect(() => {
    if (!isControlsOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (controlSurfaceRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsControlsOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [isControlsOpen]);

  useEffect(() => {
    if (viewMode !== "preview") {
      return;
    }

    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".article-body h1[id], .article-body h2[id], .article-body h3[id]",
      ),
    );

    if (headings.length === 0) {
      setActiveHeadingId("");
      return;
    }

    setActiveHeadingId((current) =>
      current && headings.some((heading) => heading.id === current)
        ? current
        : headings[0].id,
    );

    let frame = 0;

    const syncActiveHeading = () => {
      frame = 0;

      const anchorOffset = getHeadingAnchorOffset();
      const isNearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
      const lockedId = activeHeadingLockRef.current;

      if (lockedId) {
        const lockedTarget = document.getElementById(lockedId);

        if (!lockedTarget) {
          activeHeadingLockRef.current = "";
        } else {
          const lockedTop = lockedTarget.getBoundingClientRect().top;

          setActiveHeadingId((current) => (current === lockedId ? current : lockedId));

          if (lockedTop <= anchorOffset + 8 || isNearBottom) {
            activeHeadingLockRef.current = "";
          }
          return;
        }
      }

      let nextId = headings[0].id;

      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= anchorOffset) {
          nextId = heading.id;
          continue;
        }

        break;
      }

      if (isNearBottom) {
        nextId = headings[headings.length - 1].id;
      }

      setActiveHeadingId((current) => (current === nextId ? current : nextId));
    };

    const requestSync = () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(syncActiveHeading);
    };

    requestSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, [deferredMarkdown, viewMode]);

  useEffect(() => {
    if (!activeHeadingId || viewMode !== "preview") {
      return;
    }

    const tocPanel = tocPanelRef.current;
    const activeItem = tocItemRefs.current.get(activeHeadingId);
    if (!tocPanel || !activeItem || window.innerWidth <= 1080) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const itemTop = activeItem.offsetTop;
      const itemBottom = itemTop + activeItem.offsetHeight;
      const visibleTop = tocPanel.scrollTop;
      const visibleBottom = visibleTop + tocPanel.clientHeight;
      const edgeGap = 12;

      if (itemTop >= visibleTop + edgeGap && itemBottom <= visibleBottom - edgeGap) {
        return;
      }

      const nextTop = Math.max(0, itemTop - tocPanel.clientHeight * 0.28);
      tocPanel.scrollTo({
        top: nextTop,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeHeadingId, viewMode]);

  useEffect(() => {
    if (!pendingScrollId || viewMode !== "preview") {
      return;
    }

    let frameOne = 0;
    let frameTwo = 0;

    const scrollToHeading = () => {
      const target = document.getElementById(pendingScrollId);
      if (!target) {
        setPendingScrollId("");
        return;
      }

      const offset = getHeadingAnchorOffset();
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
      setPendingScrollId("");
    };

    frameOne = window.requestAnimationFrame(() => {
      frameTwo = window.requestAnimationFrame(scrollToHeading);
    });

    return () => {
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
    };
  }, [pendingScrollId, viewMode, deferredMarkdown, isControlsOpen]);

  useEffect(() => {
    if (pendingRestoreScrollY === null) {
      isRestoringPositionRef.current = false;
      return;
    }

    let frameOne = 0;
    let frameTwo = 0;

    frameOne = window.requestAnimationFrame(() => {
      frameTwo = window.requestAnimationFrame(() => {
        window.scrollTo({
          top: Math.max(0, pendingRestoreScrollY),
        });
        isRestoringPositionRef.current = false;
        setPendingRestoreScrollY(null);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
    };
  }, [deferredMarkdown, pendingRestoreScrollY, viewMode]);

  useEffect(() => {
    let frame = 0;

    const syncReadingProgress = () => {
      frame = 0;

      if (!documentBodyRef.current) {
        setReadingProgress(0);
        return;
      }

      setReadingProgress(calculateReadingProgress(documentBodyRef.current));
    };

    const requestSync = () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(syncReadingProgress);
    };

    requestSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, [deferredMarkdown, documentState.documentKey, viewMode]);

  useEffect(() => {
    let timeoutId = 0;

    const persistCurrentPosition = () => {
      if (isRestoringPositionRef.current) {
        return;
      }

      persistReadingState(documentState.documentKey, {
        scrollY: Math.max(0, Math.round(window.scrollY)),
        viewMode,
        updatedAt: Date.now(),
      });
    };

    const schedulePersist = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(persistCurrentPosition, 160);
    };

    schedulePersist();
    window.addEventListener("scroll", schedulePersist, { passive: true });
    window.addEventListener("pagehide", persistCurrentPosition);

    return () => {
      window.clearTimeout(timeoutId);
      persistCurrentPosition();
      window.removeEventListener("scroll", schedulePersist);
      window.removeEventListener("pagehide", persistCurrentPosition);
    };
  }, [documentState.documentKey, viewMode]);

  function rememberRecentDocument(nextDocumentState: DocumentState) {
    const nextRecentDocument: RecentDocument = {
      documentKey: nextDocumentState.documentKey,
      fileName: nextDocumentState.fileName,
      markdown: nextDocumentState.markdown,
      lastOpenedAt: Date.now(),
    };

    setRecentDocuments((current) =>
      persistRecentDocuments([nextRecentDocument, ...current]),
    );
  }

  function openDocument(
    nextDocumentState: DocumentState,
    options?: { rememberRecent?: boolean },
  ) {
    const savedState = getSavedReadingState(nextDocumentState.documentKey);

    if (options?.rememberRecent) {
      rememberRecentDocument(nextDocumentState);
    }

    startTransition(() => {
      isRestoringPositionRef.current = true;
      setDocumentState(nextDocumentState);
      setViewMode(savedState?.viewMode ?? "preview");
      setPendingRestoreScrollY(savedState?.scrollY ?? 0);
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchMatchCount(0);
      setActiveSearchIndex(-1);
      setIsControlsOpen(false);
      setFocusedImage(null);
      setErrorMessage("");
    });
  }

  async function loadFile(file: File | null) {
    if (!file) {
      return;
    }

    if (!isAcceptedFile(file)) {
      setErrorMessage("CalmMD 目前支持 .md、.markdown 和 .txt 文件。");
      return;
    }

    try {
      const markdown = await file.text();
      openDocument(createDocumentState(markdown, file.name), {
        rememberRecent: true,
      });
    } catch {
      setErrorMessage("这份文稿暂时没能读取出来，换一份文件再试试。");
    }
  }

  loadFileRef.current = loadFile;

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchMatchCount(0);
    setActiveSearchIndex(-1);
  }

  function toggleSearch() {
    setIsControlsOpen(false);
    setIsSearchOpen((current) => {
      if (current) {
        setSearchQuery("");
        setSearchMatchCount(0);
        setActiveSearchIndex(-1);
      }

      return !current;
    });
  }

  function navigateSearch(direction: 1 | -1) {
    if (searchMatchCount === 0) {
      return;
    }

    setActiveSearchIndex((current) => {
      const currentIndex = current < 0 ? 0 : current;
      return (currentIndex + direction + searchMatchCount) % searchMatchCount;
    });
  }

  async function openFilePicker() {
    if (
      "showOpenFilePicker" in window &&
      typeof (window as Window & { showOpenFilePicker?: unknown }).showOpenFilePicker === "function"
    ) {
      try {
        const [handle] = await (
          window as Window & {
            showOpenFilePicker: (options: {
              types: { accept: Record<string, string[]> }[];
              multiple?: boolean;
            }) => Promise<FileSystemFileHandle[]>;
          }
        ).showOpenFilePicker({
          types: [
            {
              accept: {
                "text/markdown": [".md", ".markdown"],
                "text/plain": [".txt"],
              },
            },
          ],
          multiple: false,
        });
        const file = await handle.getFile();
        await loadFile(file);
      } catch (err) {
        // 用户取消或拒绝授权时不回退，避免意外弹出
        if (err instanceof Error && err.name !== "AbortError") {
          fileInputRef.current?.click();
        }
      }
    } else {
      fileInputRef.current?.click();
    }
  }

  function handleOpenImage(image: FocusedImage) {
    setIsControlsOpen(false);
    setFocusedImage(image);
  }

  function handleOpenRecentDocument(documentKey: string) {
    const nextDocument = recentDocuments.find(
      (document) => document.documentKey === documentKey,
    );

    if (!nextDocument) {
      return;
    }

    openDocument(
      createDocumentState(nextDocument.markdown, nextDocument.fileName),
      { rememberRecent: true },
    );
  }

  function handleRemoveRecentDocument(documentKey: string) {
    setRecentDocuments((current) => {
      const next = current.filter((doc) => doc.documentKey !== documentKey);
      return persistRecentDocuments(next);
    });
  }

  function handleClearAllRecentDocuments() {
    setRecentDocuments([]);
    try {
      window.localStorage.removeItem(RECENT_DOCUMENTS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function registerTocItem(id: string, element: HTMLButtonElement | null) {
    if (element) {
      tocItemRefs.current.set(id, element);
      return;
    }

    tocItemRefs.current.delete(id);
  }

  function onDragEnter(event: DragEvent<HTMLElement>) {
    if (!event.dataTransfer.types.includes("Files")) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setDragActive(true);
  }

  function onDragOver(event: DragEvent<HTMLElement>) {
    if (!event.dataTransfer.types.includes("Files")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  }

  function onDragLeave(event: DragEvent<HTMLElement>) {
    if (!event.dataTransfer.types.includes("Files")) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setDragActive(false);
    }
  }

  async function onDrop(event: DragEvent<HTMLElement>) {
    if (!event.dataTransfer.types.includes("Files")) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);

    await loadFile(event.dataTransfer.files[0] ?? null);
  }

  function handleSelectTocItem(id: string) {
    setIsControlsOpen(false);
    activeHeadingLockRef.current = id;
    setActiveHeadingId(id);
    setPendingScrollId(id);
    if (viewMode !== "preview") {
      setViewMode("preview");
    }
  }

  function toggleViewMode() {
    setViewMode((current) => (current === "preview" ? "source" : "preview"));
  }

  function toggleWidthMode() {
    setWidthMode((current) => (current === "focused" ? "relaxed" : "focused"));
  }

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";

    if (typeof window === "undefined") {
      setTheme(nextTheme);
      return;
    }

    const transitionDocument = document as ThemeTransitionDocument;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
      typeof transitionDocument.startViewTransition === "function" &&
      !prefersReducedMotion
    ) {
      const transition = transitionDocument.startViewTransition(() => {
        flushSync(() => {
          setTheme(nextTheme);
        });
      });

      void transition.finished.catch(() => undefined);
      return;
    }

    setTheme(nextTheme);
  }

  return (
    <div
      className="app-shell"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        accept=".md,.markdown,.txt,text/plain,text/markdown"
        onChange={(event) => {
          void loadFile(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />

      <DropOverlay active={dragActive} />

      <main className="layout">
        <aside className="side-rail">
          <div className="control-slot">
            <ReaderControls
              controlSurfaceRef={controlSurfaceRef}
              isOpen={isControlsOpen}
              isSearchOpen={isSearchOpen}
              fileName={documentState.fileName}
              sectionsCount={sectionsCount}
              readingMinutes={readingMinutes}
              viewMode={viewMode}
              widthMode={widthMode}
              theme={theme}
              onToggleOpen={() => setIsControlsOpen((current) => !current)}
              onToggleSearch={toggleSearch}
              onOpenFilePicker={openFilePicker}
              onToggleViewMode={toggleViewMode}
              onToggleWidthMode={toggleWidthMode}
              onToggleTheme={toggleTheme}
            />
          </div>

          <RecentDocuments
            documents={recentDocuments}
            currentDocumentKey={documentState.documentKey}
            onOpen={handleOpenRecentDocument}
            onRemove={handleRemoveRecentDocument}
            onClearAll={handleClearAllRecentDocuments}
          />

          <div ref={tocPanelRef} className="toc-panel">
            <TocList
              items={documentState.toc}
              activeHeadingId={activeHeadingId}
              emptyMessage="这份文稿里还没有可浏览的标题结构。"
              onSelect={handleSelectTocItem}
              registerItem={registerTocItem}
            />
          </div>

          <div className="side-rail__footer">
            <ReadingProgress
              className="reading-progress--rail"
              progressPercent={progressPercent}
            />
          </div>
        </aside>

        <section className="reader-panel">
          <div className="document-card">
            {isSearchOpen ? (
              <div className="reader-toolbar">
                <ReaderSearch
                  isOpen={isSearchOpen}
                  query={searchQuery}
                  matchCount={searchMatchCount}
                  activeMatchIndex={activeSearchIndex}
                  onQueryChange={setSearchQuery}
                  onPrevious={() => navigateSearch(-1)}
                  onNext={() => navigateSearch(1)}
                  onClose={closeSearch}
                />
              </div>
            ) : null}

            {errorMessage ? <p className="notice">{errorMessage}</p> : null}

            <RecentDocuments
              documents={recentDocuments}
              currentDocumentKey={documentState.documentKey}
              onOpen={handleOpenRecentDocument}
              onRemove={handleRemoveRecentDocument}
              onClearAll={handleClearAllRecentDocuments}
              mobile
            />

            <details className="mobile-toc">
              <summary>目录</summary>
              <TocList
                items={documentState.toc}
                activeHeadingId={activeHeadingId}
                emptyMessage="这份文稿里还没有可浏览的标题结构。"
                onSelect={handleSelectTocItem}
                mobile
              />
            </details>

            <ReadingProgress
              className="reading-progress--mobile"
              progressPercent={progressPercent}
            />

            <div
              ref={documentBodyRef}
              className="document-card__body"
              data-width={widthMode}
              onClickCapture={() => {
                if (isControlsOpen) {
                  setIsControlsOpen(false);
                }
              }}
            >
              <SearchableContent
                contentVersion={searchableContentVersion}
                query={searchQuery}
                activeMatchIndex={activeSearchIndex}
                onMatchCountChange={setSearchMatchCount}
              >
                {viewMode === "preview" ? (
                  <MarkdownRenderer
                    markdown={deferredMarkdown}
                    onOpenImage={handleOpenImage}
                  />
                ) : (
                  <pre className="source-view">
                    <code>{documentState.markdown}</code>
                  </pre>
                )}
              </SearchableContent>
            </div>
          </div>
        </section>
      </main>

      <ImageLightbox
        image={focusedImage}
        onClose={() => setFocusedImage(null)}
      />
    </div>
  );
}
