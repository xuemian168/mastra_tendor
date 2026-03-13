/**
 * Unified localStorage wrapper with SSR safety and error handling.
 * Replaces repeated try-catch + typeof window checks across 4 files.
 */

export function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorage(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

/**
 * Raw string storage — for values that don't need JSON serialization
 * (e.g., sidebar-open = "true"/"false").
 */
export function getRawStorage(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export function setRawStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}
