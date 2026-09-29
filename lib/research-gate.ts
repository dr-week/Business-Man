type Waiter = {
  signal?: AbortSignal;
  resolve: (release: () => void) => void;
  reject: (error: Error) => void;
  abort: () => void;
};

/** Per-isolate concurrency and queue bound for memory-heavy research fan-out. */
export function createResearchGate(maxActive: number, maxWaiting: number) {
  let active = 0;
  const waiting: Waiter[] = [];

  function releaseHandle(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      active--;
      while (active < maxActive && waiting.length) {
        const waiter = waiting.shift()!;
        waiter.signal?.removeEventListener("abort", waiter.abort);
        if (waiter.signal?.aborted) {
          waiter.reject(new Error("Research cancelled."));
          continue;
        }
        active++;
        waiter.resolve(releaseHandle());
      }
    };
  }

  function acquire(signal?: AbortSignal): Promise<() => void> {
    if (signal?.aborted) return Promise.reject(new Error("Research cancelled."));
    if (active < maxActive) {
      active++;
      return Promise.resolve(releaseHandle());
    }
    if (waiting.length >= maxWaiting) return Promise.reject(new Error("Research capacity reached."));
    return new Promise((resolve, reject) => {
      const waiter: Waiter = {
        signal, resolve, reject,
        abort: () => {
          signal?.removeEventListener("abort", waiter.abort);
          const index = waiting.indexOf(waiter);
          if (index < 0) return;
          waiting.splice(index, 1);
          reject(new Error("Research cancelled."));
        },
      };
      waiting.push(waiter);
      signal?.addEventListener("abort", waiter.abort, { once: true });
      if (signal?.aborted) waiter.abort();
    });
  }

  return { acquire };
}
