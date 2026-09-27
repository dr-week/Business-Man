import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = join(root, "services", "collector");
const python = join(directory, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
if (!existsSync(python)) throw new Error("Set up services/collector/.venv using the collector README first.");
const varsPath = join(root, ".dev.vars");
let vars = existsSync(varsPath) ? readFileSync(varsPath, "utf8") : "";
let key = vars.match(/^COLLECTOR_KEY="?([a-f0-9]{64})"?\s*$/m)?.[1];
if (!key) {
  if (/^COLLECTOR_KEY=/m.test(vars)) throw new Error("Existing COLLECTOR_KEY format requires manual configuration; it was not overwritten.");
  key = randomBytes(32).toString("hex");
  vars += `\nCOLLECTOR_KEY="${key}"\n`;
}
if (!/^COLLECTOR_URL=/m.test(vars)) vars += 'COLLECTOR_URL="http://127.0.0.1:8788/collect"\n';
writeFileSync(varsPath, vars, { mode: 0o600 });
const child = spawn(python, ["server.py"], { cwd: directory, env: { ...process.env, COLLECTOR_KEY: key }, stdio: "inherit", windowsHide: true });
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
process.on("SIGINT", () => child.kill());
process.on("SIGTERM", () => child.kill());
