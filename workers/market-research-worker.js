// Cloudflare Workers script for market research API with KV caching
// This is an experimental module to cache heavy market data in Cloudflare KV.
// To deploy, add a wrangler.toml in the project root and bind a KV namespace named MARKET_RESEARCH.

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Handles the incoming request.
 * If a cached response exists in KV (key: 'market-research'), return it.
 * Otherwise fetch fresh data from the origin API, cache it for 6 hours, and return.
 */
async function handleRequest(request) {
  const cacheKey = 'market-research';
  const kv = MARKET_RESEARCH; // KV binding defined in wrangler.toml
  const cached = await kv.get(cacheKey, {type: 'json'});
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json', 'CF-Cache-Status': 'HIT' }
    });
  }

  // Forward request to the origin market-research API (adjust URL as needed)
  const originUrl = new URL(request.url);
  originUrl.hostname = 'YOUR_ORIGIN_HOST'; // replace with actual host
  originUrl.pathname = '/api/market-research';

  const response = await fetch(originUrl.toString(), {
    method: 'GET',
    headers: request.headers,
    cf: { cacheTtl: 0 } // bypass Cloudflare cache, we manage KV
  });

  if (!response.ok) {
    return new Response('Failed to fetch market data', { status: 502 });
  }

  const data = await response.json();
  // Store in KV for 6 hours (21600 seconds)
  await kv.put(cacheKey, JSON.stringify(data), { expirationTtl: 21600 });

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', 'CF-Cache-Status': 'MISS' }
  });
}
