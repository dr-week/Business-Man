"""Small local adapter. Fetching happens only on an authenticated POST."""
import hmac
import json
import os
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import BoundedSemaphore
from providers.scrapling_provider import collect

KEY = os.environ.get("COLLECTOR_KEY", "")
if not KEY:
    raise RuntimeError("COLLECTOR_KEY is required")
gate = BoundedSemaphore(1)


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(5)

    def log_message(self, *_args):
        pass

    def send(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self.send(200 if self.path == "/health" else 404, {"service": "Scrapling collector", "version": "0.4.15"})

    def do_POST(self):
        if self.path != "/collect":
            return self.send(404, {"error": "Not found"})
        if not hmac.compare_digest(self.headers.get("Authorization", "").encode(), ("Bearer " + KEY).encode()):
            return self.send(401, {"error": "Unauthorized"})
        if not gate.acquire(blocking=False):
            return self.send(503, {"error": "Collector busy"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 10000:
                return self.send(413, {"error": "Body too large or empty"})
            data = json.loads(self.rfile.read(length))
            urls = data.get("urls") if isinstance(data, dict) else None
            if not isinstance(urls, list) or not 1 <= len(urls) <= 3 or any(not isinstance(url, str) or len(url) > 2000 for url in urls):
                return self.send(400, {"error": "Provide 1-3 URLs"})
            with ThreadPoolExecutor(max_workers=2) as pool:
                results = list(pool.map(collect, dict.fromkeys(urls)))
            self.send(200, {"results": results})
        except (ValueError, TimeoutError):
            self.send(400, {"error": "Invalid request"})
        finally:
            gate.release()


if __name__ == "__main__":
    print("Collector listening on http://127.0.0.1:8788", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8788), Handler).serve_forever()
