import http from "node:http";

const port = process.argv[2] || process.env.PORT || "5173";
const expectedApp = "businessman";

const req = http.get(`http://127.0.0.1:${port}/api/health`, { timeout: 1500 }, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      if (json.app === expectedApp && json.status === "ok") {
        process.stdout.write("IS_BUSINESSMAN");
        process.exit(0);
      } else {
        process.stdout.write("OTHER_PROJECT");
        process.exit(0);
      }
    } catch {
      process.stdout.write("OTHER_SERVICE");
      process.exit(0);
    }
  });
});

req.on("error", () => {
  process.stdout.write("NOT_LISTENING");
  process.exit(0);
});

req.on("timeout", () => {
  req.destroy();
  process.stdout.write("TIMEOUT");
  process.exit(0);
});
