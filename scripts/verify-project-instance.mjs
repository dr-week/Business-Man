import http from "node:http";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function activeLockPort() {
  try {
    const lock = JSON.parse(readFileSync(join(process.cwd(), ".vinext", "dev", "lock.json"), "utf8"));
    if (typeof lock.cwd !== "string" || resolve(lock.cwd).toLowerCase() !== resolve(process.cwd()).toLowerCase()) return "";
    if (!Number.isInteger(lock.pid) || lock.pid < 1) return "";
    try { process.kill(lock.pid, 0); }
    catch (error) { if (error.code !== "EPERM") return ""; }
    return String(lock.port ?? "");
  } catch { return ""; }
}

const rawPort = process.env.VERIFY_PORT || process.argv[2] || process.env.PORT || activeLockPort();
const parsedPort = Number(rawPort);
if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
  process.stdout.write("NOT_LISTENING");
  process.exit(0);
}
const port = String(parsedPort);
const expectedApp = "businessman";
const maxHealthBytes = 8 * 1024;
let finished = false;

function finish(status) {
  if (finished) return;
  finished = true;
  process.stdout.write(status);
}

const req = http.get(`http://localhost:${port}/api/health`, { timeout: 1500 }, (res) => {
  let data = "", bytes = 0;
  res.on("data", (chunk) => {
    bytes += chunk.length;
    if (bytes > maxHealthBytes) {
      finish("OTHER_SERVICE");
      res.destroy();
      return;
    }
    data += chunk;
  });
  res.on("end", () => {
    if (res.statusCode !== 200) return finish("OTHER_SERVICE");
    try {
      const json = JSON.parse(data);
      if (json.app === expectedApp && json.status === "ok") {
        finish(`IS_BUSINESSMAN:${port}`);
      } else {
        finish("OTHER_PROJECT");
      }
    } catch {
      finish("OTHER_SERVICE");
    }
  });
  res.on("error", () => finish("OTHER_SERVICE"));
});

req.on("error", () => finish("NOT_LISTENING"));

req.on("timeout", () => {
  req.destroy();
  finish("TIMEOUT");
});
