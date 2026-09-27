import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getNews, resetNewsCache } from "./feed";

describe("news feed", () => {
  beforeEach(() => {
    resetNewsCache();
  });

  afterEach(() => {
    resetNewsCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("handles feed parsing, sorting, deduplication, and caching", async () => {
    const bbcXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BBC News - Business</title>
    <item>
      <title>Global Markets Shift</title>
      <link>https://www.bbc.co.uk/news/business-100?utm_source=rss</link>
      <description>Market commentary for the week.</description>
      <pubDate>Sun, 27 Sep 2026 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Global Markets Shift Duplicate</title>
      <link>https://www.bbc.co.uk/news/business-100</link>
      <description>Market commentary duplicate.</description>
      <pubDate>Sun, 27 Sep 2026 11:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

    const guardianXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Guardian Business</title>
    <item>
      <title>Supply Chain Log</title>
      <link>https://www.theguardian.com/business/2026/sep/27/supply-chain</link>
      <description>New logistics standard announced.</description>
      <pubDate>Sun, 27 Sep 2026 13:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("bbci.co.uk")) {
        return new Response(bbcXml, { status: 200, headers: { "Content-Type": "application/rss+xml" } });
      }
      if (url.includes("theguardian.com")) {
        return new Response(guardianXml, { status: 200, headers: { "Content-Type": "application/rss+xml" } });
      }
      return new Response("Not found", { status: 404 });
    }));

    const feed = await getNews();
    expect(feed.items.length).toBe(2);
    expect(feed.items[0].title).toBe("Supply Chain Log");
    expect(feed.items[0].url).toBe("https://www.theguardian.com/business/2026/sep/27/supply-chain");
    expect(feed.items[1].title).toBe("Global Markets Shift");
    expect(feed.items[1].url).toBe("https://www.bbc.co.uk/news/business-100");
    expect(feed.stale).toBe(false);
    expect(feed.unavailable).toEqual([]);

    // Check in-process cache
    const cachedFeed = await getNews();
    expect(cachedFeed).toBe(feed);
  });

  it("reports partial feed failures when one provider fails", async () => {
    const guardianXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Guardian Business</title>
    <item>
      <title>Semiconductor Export Shift</title>
      <link>https://www.theguardian.com/business/2026/sep/27/semiconductor</link>
      <description>Regulatory framework announced.</description>
      <pubDate>Sun, 27 Sep 2026 13:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("theguardian.com")) {
        return new Response(guardianXml, { status: 200, headers: { "Content-Type": "application/rss+xml" } });
      }
      return new Response("Feed unavailable", { status: 500 });
    }));

    const feed = await getNews();
    expect(feed.items.length).toBe(1);
    expect(feed.items[0].title).toBe("Semiconductor Export Shift");
    expect(feed.unavailable).toContain("BBC Business");
    expect(feed.stale).toBe(false);
  });

  it("throws when all feeds fail on initial fetch", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Error", { status: 500 })));
    await expect(getNews()).rejects.toThrow("News feeds unavailable");
  });
});
