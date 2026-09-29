/** Isolate-local TTL/LRU cache with a conservative JSON-size ceiling. */
export function createBoundedCache<T>(maxEntries: number, maxBytes: number) {
  if (maxEntries < 1 || maxBytes < 1) throw new RangeError("Cache limits must be positive.");
  const entries = new Map<string, { value: T; expires: number; bytes: number }>();
  let usedBytes = 0;

  function remove(key: string) {
    const entry = entries.get(key);
    if (entry) { usedBytes -= entry.bytes; entries.delete(key); }
  }

  function prune(now: number) {
    for (const [key, entry] of entries) if (entry.expires <= now) remove(key);
  }

  return {
    get(key: string, now = Date.now()): T | undefined {
      prune(now);
      const entry = entries.get(key);
      if (!entry) return undefined;
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },
    set(key: string, value: T, ttlMs: number, now = Date.now()) {
      remove(key);
      prune(now);
      if (ttlMs <= 0) return;
      const bytes = 2 * (key.length + JSON.stringify(value).length);
      if (bytes > maxBytes) return;
      while (entries.size >= maxEntries || usedBytes + bytes > maxBytes) remove(entries.keys().next().value!);
      entries.set(key, { value, expires: now + ttlMs, bytes });
      usedBytes += bytes;
    },
  };
}
