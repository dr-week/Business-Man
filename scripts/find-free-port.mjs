import net from "node:net";

const startPort = parseInt(process.argv[2] || process.env.START_PORT || "5173", 10);
const maxPort = startPort + 50;

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findPort() {
  for (let p = startPort; p <= maxPort; p++) {
    const available = await checkPort(p);
    if (available) {
      process.stdout.write(p.toString());
      process.exit(0);
    }
  }
  process.exit(1);
}

findPort();
