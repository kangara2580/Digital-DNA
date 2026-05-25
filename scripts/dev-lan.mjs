/**
 * LAN(폰·태블릿) 미리보기용 dev 서버 — 0.0.0.0 바인딩 + 모바일 URL 출력.
 * `npm run dev` 는 127.0.0.1 전용이라 폰에서 접속 불가.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = "0.0.0.0";
const port = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 3000;

function lanIpv4() {
  const nets = networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family !== "IPv4" || net.internal) continue;
      candidates.push(net.address);
    }
  }
  return (
    candidates.find((a) => a.startsWith("192.168.")) ??
    candidates.find((a) => a.startsWith("10.")) ??
    candidates[0] ??
    null
  );
}

const lanIp = lanIpv4();

function mobileLinks(ip) {
  if (!ip) return [];
  const base = `http://${ip}:${port}`;
  return [
    { label: "홈", url: `${base}/` },
    { label: "탐색", url: `${base}/explore` },
    { label: "쇼핑몰", url: `${base}/shop` },
    { label: "404 테스트", url: `${base}/zzz` },
  ];
}

function printMobileBanner(ip) {
  const links = mobileLinks(ip);
  console.log("\n\x1b[1;35m══════════════════════════════════════\x1b[0m");
  console.log("\x1b[1;35m  ARA — 모바일 미리보기 (같은 Wi‑Fi)\x1b[0m");
  console.log("\x1b[1;35m══════════════════════════════════════\x1b[0m\n");
  if (!ip) {
    console.log(
      "\x1b[33m  LAN IP를 찾지 못했습니다. Mac 설정 → Wi‑Fi → IP 주소를 확인한 뒤\x1b[0m",
    );
    console.log(`\x1b[33m  http://<맥IP>:${port}/explore 형태로 접속하세요.\x1b[0m\n`);
    return;
  }
  console.log(`  Mac IP: \x1b[1m${ip}\x1b[0m  ·  서버: \x1b[1m0.0.0.0:${port}\x1b[0m\n`);
  for (const { label, url } of links) {
    console.log(`  \x1b[36m${label.padEnd(8)}\x1b[0m ${url}`);
  }
  console.log(
    "\n\x1b[90m  ※ 폰 Safari 주소창에 위 URL을 직접 입력 (https 아님 http)\x1b[0m",
  );
  console.log(
    "\x1b[90m  ※ 안 되면: 방화벽 허용, 같은 Wi‑Fi, npm run dev(127.0.0.1) 아닌 dev:lan 사용\x1b[0m\n",
  );
}

function ping(hostHeader, p) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: hostHeader, port: p, path: "/", timeout: 3000 },
      (res) => {
        res.resume();
        resolve(res.statusCode != null && res.statusCode < 500);
      },
    );
    req.on("error", () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
const polyfillSelf = path.join(root, "scripts/polyfill-self.cjs");
const nodeOptions = [
  process.env.NODE_OPTIONS?.trim(),
  `--require=${polyfillSelf}`,
]
  .filter(Boolean)
  .join(" ");

printMobileBanner(lanIp);

const child = spawn(
  process.execPath,
  [nextCli, "dev", "-H", host, "-p", String(port)],
  {
    stdio: "inherit",
    cwd: root,
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
      WATCHPACK_POLLING: process.env.WATCHPACK_POLLING ?? "true",
      CHOKIDAR_USEPOLLING: process.env.CHOKIDAR_USEPOLLING ?? "1",
    },
  },
);

let bannerPrinted = false;

(async () => {
  for (let i = 0; i < 120; i++) {
    if (child.exitCode != null) return;
    if ((await ping("127.0.0.1", port)) || (lanIp && (await ping(lanIp, port)))) {
      if (!bannerPrinted) {
        bannerPrinted = true;
        console.log("\x1b[32m[dev:lan] 서버 준비됨\x1b[0m");
        printMobileBanner(lanIp);
      }
      return;
    }
    await delay(500);
  }
})();

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
