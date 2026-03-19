import { useCallback, useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { FlashcardView } from './components/FlashcardView';
import { parseFlashcards, FlashCard } from './lib/parser';

export default function QuizGoApp() {
  const [cards, setCards] = useState<FlashCard[]>([]);

  const handleFileLoaded = useCallback((content: string) => {
    const parsed = parseFlashcards(content);
    if (parsed.length > 0) {
      setCards(parsed);
    } else {
      alert('无法解析闪卡内容。请确认文件为 JSON 数组格式：[{ "q": "...", "a": "..." }]');
    }
  }, []);

  const handleReset = useCallback(() => {
    setCards([]);
  }, []);

  if (cards.length > 0) {
    return <FlashcardView cards={cards} onReset={handleReset} />;
  }

  return <FileUpload onFileLoaded={handleFileLoaded} />;
}
