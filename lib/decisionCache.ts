// Simple LRU cache for decision engine results.
export class DecisionCache<T> {
  private maxSize: number;
  private map = new Map<string, T>();
  private order: string[] = [];

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    if (!this.map.has(key)) return undefined;
    // Update LRU order
    const idx = this.order.indexOf(key);
    if (idx > -1) this.order.splice(idx, 1);
    this.order.push(key);
    return this.map.get(key);
  }

  set(key: string, value: T): void {
    if (this.map.has(key)) {
      // Update existing
      const idx = this.order.indexOf(key);
      if (idx > -1) this.order.splice(idx, 1);
    } else if (this.map.size >= this.maxSize) {
      // Evict LRU
      const evictKey = this.order.shift();
      if (evictKey) this.map.delete(evictKey);
    }
    this.map.set(key, value);
    this.order.push(key);
  }
}
