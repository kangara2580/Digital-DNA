import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import { setTimeout as delay } from "node:timers/promises";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = "127.0.0.1";

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

/** Next가 출력하는 `Local: http://127.0.0.1:3001` 에서 실제 주소 추출 (포트 충돌 시 필수) */
let discoveredUrl = null;
let logTail = "";

function tryDiscoverUrl(chunk) {
  logTail = (logTail + chunk).slice(-16000);
  const m = logTail.match(/Local:\s+(https?:\/\/[^\s]+)/);
  if (m) {
    discoveredUrl = m[1].replace(/\/$/, "");
  }
}

const envPort = process.env.PORT ? Number(process.env.PORT) : NaN;
const nextArgs = ["dev", "-H", host];
if (Number.isFinite(envPort) && envPort > 0) {
  nextArgs.push("-p", String(envPort));
}

const child = spawn(process.execPath, [nextCli, ...nextArgs], {
  stdio: ["inherit", "pipe", "pipe"],
  cwd: root,
  env: {
    ...process.env,
    /** stdout/stderr가 파이프여도 터미널 색 유지에 도움 */
    FORCE_COLOR: process.env.FORCE_COLOR ?? "1",
  },
});

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  tryDiscoverUrl(chunk.toString());
});
child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
  tryDiscoverUrl(chunk.toString());
});

function pingOnce(targetUrl) {
  return new Promise((resolve) => {
    try {
      const u = new URL(targetUrl);
      const lib = u.protocol === "https:" ? https : http;
      const req = lib.get(targetUrl, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => resolve(false));
      req.setTimeout(2500, () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
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
  for (let attempt = 0; attempt < 160; attempt++) {
    if (child.exitCode != null) return;

    const url =
      discoveredUrl ??
      (Number.isFinite(envPort) && envPort > 0
        ? `http://${host}:${envPort}`
        : null);

    if (url && (await pingOnce(url))) {
      if (!opened && process.platform === "darwin") {
        opened = true;
        openDarwinBrowser(url);
      }
      return;
    }

    if (!discoveredUrl && attempt > 100) {
      for (let p = 3000; p <= 3010; p++) {
        const guess = `http://${host}:${p}`;
        if (await pingOnce(guess)) {
          if (!opened && process.platform === "darwin") {
            opened = true;
            openDarwinBrowser(guess);
          }
          return;
        }
      }
    }

    await delay(200);
  }

  if (process.platform === "darwin" && !opened) {
    const fallback = discoveredUrl ?? `http://${host}:3000`;
    opened = true;
    openDarwinBrowser(fallback);
  }
})();

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
