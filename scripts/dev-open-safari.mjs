import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = "127.0.0.1";
const port = Number(process.env.PORT) || 3000;
const url = `http://${host}:${port}`;

let nextCli;
try {
  const require = createRequire(import.meta.url);
  nextCli = require.resolve("next/dist/bin/next");
} catch {
  console.error(
    "[dev] Next.js를 찾을 수 없습니다. 프로젝트 루트에서 npm install 을 실행하세요.",
  );
  process.exit(1);
}

const child = spawn(
  process.execPath,
  [nextCli, "dev", "-H", host, "-p", String(port)],
  {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, PORT: String(port) },
  },
);

function pingOnce() {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function openDarwinBrowser(targetUrl) {
  const run = (args) => {
    const p = spawn("open", args, {
      stdio: "ignore",
      detached: true,
    });
    p.unref();
    return p;
  };
  /** Safari 우선 → 실패 시 시스템 기본 브라우저(크롬 등) */
  const safari = run(["-a", "Safari", targetUrl]);
  safari.on("exit", (code) => {
    if (code !== 0) run([targetUrl]);
  });
  safari.on("error", () => {
    run([targetUrl]);
  });
}

let opened = false;
(async () => {
  for (let i = 0; i < 120; i++) {
    if (child.exitCode != null) return;
    if (await pingOnce()) {
      if (!opened && process.platform === "darwin") {
        opened = true;
        openDarwinBrowser(url);
      }
      return;
    }
    await delay(250);
  }
  if (process.platform === "darwin" && !opened) {
    opened = true;
    openDarwinBrowser(url);
  }
})();

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
