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

/** 터미널 색 이스케이프가 URL에 붙으면 ping/파싱이 실패해 Safari가 3000 등 잘못된 포트를 엽니다 */
function stripAnsi(s) {
  return s.replace(/\u001b\[[0-9;]*m/g, "");
}

let discoveredUrl = null;
/** `Port 3000 is in use … using available port 3001` — Local: 줄보다 먼저 나오는 경우가 많음 */
let portFromNextMessage = null;
let logTail = "";

function tryDiscoverUrl(chunk) {
  const clean = stripAnsi(chunk.toString());
  logTail = (logTail + clean).slice(-24000);

  const alt = clean.match(/using available port (\d+)/i);
  if (alt) {
    portFromNextMessage = Number(alt[1]);
    discoveredUrl = `http://${host}:${portFromNextMessage}`;
  }

  const local = logTail.match(/Local:\s+(https?:\/\/[^\s]+)/);
  if (local) {
    const u = stripAnsi(local[1]).replace(/\/$/, "").trim();
    try {
      new URL(u);
      discoveredUrl = u;
    } catch {
      /* ignore */
    }
  }
}

const DEFAULT_DEV_PORT = 3001;
const envPort = process.env.PORT
  ? Number(process.env.PORT)
  : DEFAULT_DEV_PORT;
const nextArgs = ["dev", "-H", host];
if (Number.isFinite(envPort) && envPort > 0) {
  nextArgs.push("-p", String(envPort));
}

const child = spawn(process.execPath, [nextCli, ...nextArgs], {
  stdio: ["inherit", "pipe", "pipe"],
  cwd: root,
  env: {
    ...process.env,
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

function logOpen(url) {
  console.log(
    `\n\x1b[36m[dev]\x1b[0m 브라우저 주소: \x1b[1m${url}\x1b[0m (Safari가 안 뜨면 주소를 직접 열어 주세요)\n`,
  );
}

let opened = false;

(async () => {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (child.exitCode != null) return;

    const url =
      discoveredUrl ??
      (Number.isFinite(envPort) && envPort > 0
        ? `http://${host}:${envPort}`
        : portFromNextMessage != null
          ? `http://${host}:${portFromNextMessage}`
          : null);

    if (url && (await pingOnce(url))) {
      if (!opened) {
        opened = true;
        logOpen(url);
        if (process.platform === "darwin") {
          openDarwinBrowser(url);
        }
      }
      return;
    }

    /* URL을 못 찾았을 때만 추측 스캔 — 높은 포트부터(대체 포트가 보통 더 큼) */
    if (!discoveredUrl && attempt > 35) {
      for (let p = 3015; p >= 3000; p--) {
        const guess = `http://${host}:${p}`;
        if (await pingOnce(guess)) {
          if (!opened) {
            opened = true;
            logOpen(guess);
            if (process.platform === "darwin") {
              openDarwinBrowser(guess);
            }
          }
          return;
        }
      }
    }

    await delay(150);
  }

  if (!opened) {
    const fallback =
      discoveredUrl ??
      (portFromNextMessage != null
        ? `http://${host}:${portFromNextMessage}`
        : Number.isFinite(envPort) && envPort > 0
          ? `http://${host}:${envPort}`
          : `http://${host}:3000`);
    opened = true;
    logOpen(fallback);
    if (process.platform === "darwin") {
      openDarwinBrowser(fallback);
    }
  }
})();

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
