import type { GeneratedComponent, Provider } from '../types';

export const MAX_PROMPT_HISTORY = 20;
export const MAX_SAVED_COMPONENTS = 30;

export function restoreProvider(value: unknown): Provider {
  return value === 'anthropic' || value === 'google' ? value : 'google';
}

export function restorePromptHistory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<string[]>((history, item) => {
    if (typeof item !== 'string' || !item.trim() || history.includes(item)) return history;
    return history.length < MAX_PROMPT_HISTORY ? [...history, item] : history;
  }, []);
}

export function addPromptToHistory(history: string[], prompt: string): string[] {
  return [prompt, ...history.filter((item) => item !== prompt)].slice(0, MAX_PROMPT_HISTORY);
}

export function restoreComponents(value: unknown): GeneratedComponent[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<GeneratedComponent[]>((components, item) => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.prompt !== 'string' || typeof item.code !== 'string' || typeof item.createdAt !== 'string') return components;
    const createdAt = new Date(item.createdAt);
    if (Number.isNaN(createdAt.getTime()) || components.length >= MAX_SAVED_COMPONENTS) return components;
    return [...components, { id: item.id, prompt: item.prompt, code: item.code, createdAt, restored: true }];
  }, []);
}
