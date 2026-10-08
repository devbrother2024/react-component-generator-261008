export const STORAGE_KEYS = {
  provider: 'rcg:provider',
  promptHistory: 'rcg:prompt-history',
  components: 'rcg:components',
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable or full; in-memory state remains usable.
  }
}
