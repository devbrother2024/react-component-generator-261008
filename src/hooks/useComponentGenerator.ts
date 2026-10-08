import { readGeneratedCode } from '../utils/generateStream';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { addPromptToHistory, MAX_SAVED_COMPONENTS, restoreComponents, restorePromptHistory } from '../utils/restore';
import { readStorage, STORAGE_KEYS, writeStorage } from '../utils/storage';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  streamingComponent: GeneratedComponent | null;
  promptHistory: string[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>(() =>
    restoreComponents(readStorage(STORAGE_KEYS.components, [])),
  );
  const [promptHistory, setPromptHistory] = useState<string[]>(() =>
    restorePromptHistory(readStorage(STORAGE_KEYS.promptHistory, [])),
  );
  const generating = useRef(false);
  const [streamingComponent, setStreamingComponent] = useState<GeneratedComponent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.components, components);
  }, [components]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.promptHistory, promptHistory);
  }, [promptHistory]);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    if (generating.current || !prompt.trim()) return;
    generating.current = true;
    const pending: GeneratedComponent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt, code: '', createdAt: new Date(),
    };
    setStreamingComponent(pending);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      const code = await readGeneratedCode(res, (text) => {
        setStreamingComponent(prev => prev ? { ...prev, code: prev.code + text } : prev);
      });
      const newComponent = { ...pending, code };

      setComponents((prev) => [newComponent, ...prev].slice(0, MAX_SAVED_COMPONENTS));
      setPromptHistory((prev) => addPromptToHistory(prev, prompt));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setStreamingComponent(null);
      generating.current = false;
      setIsLoading(false);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, []);

  return { components, streamingComponent, promptHistory, isLoading, error, generate, removeComponent, clearAll };
}
