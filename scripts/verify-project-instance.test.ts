import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { once } from "node:events";
import { afterEach, describe, expect, it } from "vitest";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

async function verify(handler: (_response: ServerResponse) => void, host = "127.0.0.1") {
  const server = createServer((_request, response) => handler(response));
  servers.push(server);
  server.listen(0, host);
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP test server.");
  const child = spawn(process.execPath, ["scripts/verify-project-instance.mjs", String(address.port)], { stdio: ["ignore", "pipe", "ignore"] });
  let output = "";
  child.stdout.setEncoding("utf8").on("data", (chunk: string) => { output += chunk; });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(new Error("Verifier did not exit.")); }, 3000);
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("close", () => { clearTimeout(timer); resolve(); });
  });
  return output;
}

describe("project instance verification", () => {
  it("never kills a PID supplied by the stale launcher file", async () => {
    const launcher = (await readFile(new URL("./launch.bat", import.meta.url), "utf8")).toLowerCase();
    expect(launcher).not.toContain("taskkill");
    expect(launcher).not.toContain("pid_file");
    expect(launcher).toContain('set "port=%port%"');
    expect(launcher).toContain('set "verify_port=%saved_port%"');
    expect(launcher).not.toContain("!port!");
    expect(launcher).not.toContain("!crash_log!");
    expect(launcher).not.toContain("pause >nul");
  });

  it("recognizes only the expected health response", async () => {
    expect(await verify((response) => response.end(JSON.stringify({ app: "businessman", status: "ok" })))).toMatch(/^IS_BUSINESSMAN:\d+$/);
    expect(await verify((response) => response.end(JSON.stringify({ app: "other", status: "ok" })))).toBe("OTHER_PROJECT");
  });

  it("recognizes the project when the dev server binds IPv6 localhost", async () => {
    expect(await verify((response) => response.end(JSON.stringify({ app: "businessman", status: "ok" })), "::1")).toMatch(/^IS_BUSINESSMAN:\d+$/);
  });

  it("stops reading oversized health responses", async () => {
    expect(await verify((response) => {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end("x".repeat(9 * 1024));
    })).toBe("OTHER_SERVICE");
  });
});
