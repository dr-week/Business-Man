import http from "node:http";

const rawPort = process.env.VERIFY_PORT || process.argv[2] || process.env.PORT || "5173";
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

const req = http.get(`http://127.0.0.1:${port}/api/health`, { timeout: 1500 }, (res) => {
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
        finish("IS_BUSINESSMAN");
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
