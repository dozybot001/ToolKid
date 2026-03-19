import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MarkdownContent } from './MarkdownContent';
import { Toast } from './Toast';
import type { FlashCard } from '../lib/parser';

interface FlashcardViewProps {
  cards: FlashCard[];
  onReset: () => void;
}

/**
 * State machine:
 * - State A: Show Background + Question only (answer hidden)
 * - State B: Show Background + Question + Answer
 *
 * Forward:  A -> B (reveal answer)  |  B -> next card A
 * Backward: B -> A (hide answer)    |  A -> previous card B
 *
 * Desktop: left-click = forward, right-click = backward
 * Keyboard: Enter/Right/Down = forward, Left/Up = backward
 *
 * All cards are pre-rendered on upload (including KaTeX math)
 * so switching is instant with no jank.
 */
export function FlashcardView({ cards, onReset }: FlashcardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [shake, setShake] = useState(false);
  const [preRenderDone, setPreRenderDone] = useState(false);
  const [direction, setDirection] = useState(0); // 1: forward, -1: backward
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const answerRef = useRef<HTMLDivElement | null>(null);

  const card = cards[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === cards.length - 1;

  // Pre-render: wait for layout + font load + minimum display time
  useEffect(() => {
    if (cards.length === 0) return;

    const minDelay = 400;
    const start = Date.now();
    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, minDelay - elapsed);
      setTimeout(() => !cancelled && setPreRenderDone(true), remaining);
    };

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (document.fonts?.ready) {
          document.fonts.ready.then(finish);
        } else {
          finish();
        }
      });
    });

    const fallback = setTimeout(() => !cancelled && setPreRenderDone(true), 3000);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [cards]);

  // Auto-scroll: when answer appears, scroll to answer
  useEffect(() => {
    if (!showAnswer) return;
    const timer = setTimeout(() => {
      answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
    return () => clearTimeout(timer);
  }, [showAnswer, currentIndex]);

  // Auto-scroll: when switching to new card, scroll to top
  useEffect(() => {
    if (!showAnswer) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    setShake(true);
    shakeTimerRef.current = setTimeout(() => {
      setShake(false);
      shakeTimerRef.current = null;
    }, 400);
  }, []);

  const handleForward = useCallback(() => {
    if (!card) return;

    if (!showAnswer) {
      setShowAnswer(true);
    } else {
      if (isLast) {
        showToast('已经是最后一题了');
        return;
      }
      setDirection(1);
      setCurrentIndex((i) => i + 1);
      setShowAnswer(false);
    }
  }, [card, showAnswer, isLast, showToast]);

  const handleBackward = useCallback(() => {
    if (!card) return;

    if (showAnswer) {
      setShowAnswer(false);
    } else {
      if (isFirst) {
        showToast('已经是第一题了');
        return;
      }
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
      setShowAnswer(true);
    }
  }, [card, showAnswer, isFirst, showToast]);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button')) return;
      if (window.getSelection()?.toString()) return;
      if (e.button === 0) {
        handleForward();
      } else if (e.button === 2) {
        e.preventDefault();
        handleBackward();
      }
    },
    [handleBackward, handleForward]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    e.preventDefault();
  }, []);

  // Keyboard: Enter / Right / Down = forward, Left / Up = backward
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, a[href], [contenteditable]')) return;
      if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleForward();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleBackward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBackward, handleForward]);

  if (!card) {
    return null;
  }

  return (
    <div className={`flashcard-view ${shake ? 'animate-shake' : ''}`}>
      {/* Interaction layer: content receives scroll, desktop mouse navigation */}
      <div
        className="flashcard-view__interaction-layer"
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {cards.map((c, i) => {
          const isCurrent = i === currentIndex;
          const slideFrom = isCurrent ? 0 : direction >= 0 ? 16 : -16;
          return (
            <div
              key={c.id}
              ref={isCurrent ? scrollContainerRef : undefined}
              className={`flashcard-view__card scrollbar-edge ${
                isCurrent
                  ? 'flashcard-view__card--current'
                  : 'flashcard-view__card--hidden'
              }`}
              style={{
                transform: isCurrent ? 'translateX(0)' : `translateX(${slideFrom}px)`,
                backfaceVisibility: 'hidden',
              }}
              aria-hidden={!isCurrent}
            >
              <div className="flashcard-view__card-inner">
                <p className="flashcard-view__counter">
                  {i + 1} / {cards.length}
                </p>
                {c.title && (
                  <p className="flashcard-view__title">{c.title}</p>
                )}

                {c.background && (
                  <div className="flashcard-view__background">
                    <MarkdownContent content={c.background} className="text-context" />
                  </div>
                )}

                <div className="flashcard-view__question">
                  <MarkdownContent content={c.question} className="text-question" />
                </div>

                {/* Answer is always in the DOM for pre-rendering (KaTeX), hidden via CSS */}
                <div
                  ref={isCurrent ? answerRef : undefined}
                  className={`flashcard-view__answer ${
                    i === currentIndex && showAnswer
                      ? 'flashcard-view__answer--visible'
                      : 'flashcard-view__answer--hidden'
                  }`}
                >
                  <MarkdownContent content={c.answer} className="text-answer" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading overlay */}
      {!preRenderDone && (
        <div className="flashcard-view__loading">
          <div className="flashcard-view__spinner animate-spin-slow" />
          <p className="flashcard-view__loading-text">加载中…</p>
          <p className="flashcard-view__loading-count">{cards.length} 题</p>
        </div>
      )}

      {/* Reset button - top left */}
      <button
        type="button"
        onClick={onReset}
        className="flashcard-view__reset-btn"
      >
        换一份
      </button>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}
