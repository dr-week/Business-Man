"""Deterministic extraction from public HTML. No generated financial estimates."""
import json
from datetime import datetime, timezone
from hashlib import sha256


def extract(page, url):
    title = page.css("title::text").get() or page.css("h1::text").get() or url
    description = page.css('meta[name="description"]::attr(content)').get()
    paragraphs = page.css("main p, article p, p")[:12]
    excerpt = description or " ".join(p.get_all_text() for p in paragraphs)
    tables = []
    for row in page.css("table tr")[:30]:
        cells = [cell.get_all_text().strip()[:180] for cell in row.css("th, td")[:6]]
        if len(cells) >= 2:
            tables.append(cells)
    products = []
    def visit(value, depth=0):
        if depth > 8 or len(products) >= 10:
            return
        if isinstance(value, list):
            for item in value[:30]:
                visit(item, depth + 1)
        elif isinstance(value, dict):
            if value.get("@type") == "Product":
                offers = value.get("offers", [])
                if isinstance(offers, dict):
                    offers = [offers]
                for offer in offers[:5] if isinstance(offers, list) else []:
                    if isinstance(offer, dict):
                        products.append({"name": str(value.get("name", ""))[:200], "price": str(offer.get("price", ""))[:40], "currency": str(offer.get("priceCurrency", ""))[:8]})
            visit(value.get("@graph", []), depth + 1)
    for script in page.css('script[type="application/ld+json"]::text')[:10]:
        try:
            raw = str(script)
            if len(raw) < 100000:
                visit(json.loads(raw))
        except (ValueError, RecursionError):
            continue
    published = page.css('meta[property="article:published_time"]::attr(content)').get() or ""
    return {"id": "web:" + sha256(url.encode()).hexdigest()[:24], "provider": "Web page", "kind": "discussion",
            "title": str(title).strip()[:240], "excerpt": str(excerpt or title).strip()[:1200], "url": url,
            "publishedAt": published[:40], "retrievedAt": datetime.now(timezone.utc).isoformat(), "comments": 0,
            "facts": {"tables": tables, "products": products}}
