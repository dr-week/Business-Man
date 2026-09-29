import net from "node:net";

const startPort = parseInt(process.argv[2] || process.env.START_PORT || "5173", 10);
const maxPort = startPort + 50;

function checkPort(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (error) => resolve(["EAFNOSUPPORT", "EADDRNOTAVAIL", "EPROTONOSUPPORT"].includes(error.code) ? null : false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function isAvailable(port) {
  const [ipv4, ipv6] = await Promise.all([checkPort(port, "127.0.0.1"), checkPort(port, "::1")]);
  return ipv4 === true && ipv6 !== false;
}

async function findPort() {
  for (let p = startPort; p <= maxPort; p++) {
    const available = await isAvailable(p);
    if (available) {
      process.stdout.write(p.toString());
      process.exit(0);
    }
  }
  process.exit(1);
}

findPort();
