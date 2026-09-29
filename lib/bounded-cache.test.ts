import { describe, expect, it } from "vitest";
import { createBoundedCache } from "./bounded-cache";

describe("bounded research cache", () => {
  it("expires entries and promotes recently read entries", () => {
    const cache = createBoundedCache<string>(2, 1000);
    cache.set("a", "first", 10, 0);
    cache.set("b", "second", 100, 0);
    expect(cache.get("a", 5)).toBe("first");
    cache.set("c", "third", 100, 5);
    expect(cache.get("b", 5)).toBeUndefined();
    expect(cache.get("a", 10)).toBeUndefined();
    expect(cache.get("c", 10)).toBe("third");
  });

  it("evicts for byte budget and skips oversized results", () => {
    const cache = createBoundedCache<string>(8, 28);
    cache.set("a", "1234567890", 100, 0);
    cache.set("b", "1234567890", 100, 0);
    expect(cache.get("a", 1)).toBeUndefined();
    expect(cache.get("b", 1)).toBe("1234567890");
    cache.set("large", "12345678901234567890", 100, 0);
    expect(cache.get("large", 1)).toBeUndefined();
    expect(cache.get("b", 1)).toBe("1234567890");
  });
});
