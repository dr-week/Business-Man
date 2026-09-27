"""Public HTTPS only, pinned DNS, bounded responses, explicit challenge states."""
import ipaddress
import socket
from urllib.parse import urlsplit, urlunsplit
from urllib.robotparser import RobotFileParser
from scrapling.fetchers import Fetcher
from extractors.business_page import extract

AGENT = "BusinessmanResearch/1.0"


def public_target(raw):
    url = urlsplit(raw)
    if url.scheme != "https" or not url.hostname or url.username or url.password or url.port not in (None, 443):
        raise ValueError("Only public HTTPS URLs on port 443 are supported")
    host = url.hostname.encode("idna").decode("ascii")
    addresses = {entry[4][0] for entry in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)}
    if not addresses or any(not ipaddress.ip_address(address).is_global for address in addresses):
        raise ValueError("Private or reserved addresses are not allowed")
    address = sorted(addresses)[0]
    if ":" in address:
        address = f"[{address}]"
    return urlunsplit(("https", host, url.path or "/", url.query, "")), host, address


def fetch(url, _host=None, _address=None):
    response = Fetcher.get(url, timeout=8, retries=0, follow_redirects=False, stealthy_headers=False,
                           headers={"User-Agent": AGENT, "Accept": "text/html,application/xhtml+xml,text/plain", "Accept-Encoding": "identity"})
    if len(response.body) > 1_000_000:
        raise ValueError("Response body exceeded 1 MB limit")
    return response


def collect(raw):
    try:
        url, host, address = public_target(raw)
        robots = fetch(f"https://{host}/robots.txt", host, address)
        if robots.status == 200:
            parser = RobotFileParser()
            parser.parse(robots.body.decode("utf-8", errors="replace").splitlines())
            if not parser.can_fetch(AGENT, url):
                return {"url": raw, "status": "blocked", "reason": "Source robots policy disallows collection"}
        elif robots.status != 404:
            return {"url": raw, "status": "blocked", "reason": "Source robots policy could not be checked"}
        page = fetch(url, host, address)
        html = page.body.decode("utf-8", errors="replace")
        headers = {str(key).lower(): str(value).lower() for key, value in page.headers.items()}
        if page.status in (401, 403, 429) or headers.get("cf-mitigated") == "challenge" or any(marker in html.lower() for marker in ("/cdn-cgi/challenge-platform/", "cf-chl-", "verify you are human", "checking your browser")):
            return {"url": raw, "status": "blocked", "reason": "Access denied, rate limited, or human verification required"}
        if 300 <= page.status < 400:
            return {"url": raw, "status": "blocked", "reason": "Redirect requires the final public URL"}
        if page.status != 200:
            return {"url": raw, "status": "failed", "reason": f"Source returned HTTP {page.status}"}
        if "html" not in headers.get("content-type", ""):
            return {"url": raw, "status": "unsupported", "reason": "HTML pages only; PDF or API adapter required"}
        signal = extract(page, url)
        if not signal["excerpt"] or (len(signal["excerpt"]) < 80 and "<script" in html.lower()):
            return {"url": raw, "status": "unsupported", "reason": "No readable content; browser rendering may be required"}
        return {"url": raw, "status": "ok", "signal": signal}
    except ValueError:
        return {"url": raw, "status": "blocked", "reason": "URL is invalid or not publicly reachable"}
    except Exception:
        return {"url": raw, "status": "failed", "reason": "Source fetch failed or exceeded its limits"}
