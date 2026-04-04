import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = "127.0.0.1";
const port = Number(process.env.PORT) || 3000;
const url = `http://${host}:${port}`;
const nextBin = path.join(root, "node_modules", ".bin", "next");

const child = spawn(nextBin, ["dev", "-H", host], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

function pingOnce() {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

let opened = false;
(async () => {
  for (let i = 0; i < 120; i++) {
    if (child.exitCode != null) return;
    if (await pingOnce()) {
      if (!opened && process.platform === "darwin") {
        opened = true;
        spawn("open", ["-a", "Safari", url], {
          stdio: "ignore",
          detached: true,
        }).unref();
      }
      return;
    }
    await delay(250);
  }
})();

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
