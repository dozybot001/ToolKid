export interface FlashCard {
  id: number;
  number: number;
  question: string;
  answer: string;
  background?: string;
  title?: string;
}

/**
 * JSON format:
 * [
 *   { "q": "question text (markdown)", "a": "answer text (markdown)" },
 *   ...
 * ]
 *
 * Or with optional fields:
 *   { "q": "...", "a": "...", "bg": "background/context", "title": "..." }
 */
export function parseFlashcards(content: string): FlashCard[] {
  if (!content || typeof content !== 'string') {
    return [];
  }

  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    return [];
  }

  if (!Array.isArray(data)) {
    return [];
  }

  const cards: FlashCard[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item || typeof item !== 'object') continue;

    const q = (item as Record<string, unknown>).q;
    const a = (item as Record<string, unknown>).a;
    if (typeof q !== 'string' || typeof a !== 'string' || !q.trim() || !a.trim()) continue;

    const bg = (item as Record<string, unknown>).bg;
    const title = (item as Record<string, unknown>).title;

    cards.push({
      id: i,
      number: cards.length + 1,
      question: q.trim(),
      answer: a.trim(),
      background: typeof bg === 'string' ? bg.trim() : undefined,
      title: typeof title === 'string' ? title.trim() : undefined,
    });
  }

  return cards;
}
