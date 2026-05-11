import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const origin = "https://through-sliding-doors.rosiesplace.org.au";
const outDir = path.resolve("public", "tsd-mirror");
const maxDownloads = 2000;
const mirroredRoutes = ["/", "/about", "/chapter-1", "/chapter-2", "/chapter-3", "/chapter-4", "/chapter-5"];

const seen = new Set();
const queue = mirroredRoutes.map((route) => new URL(route, origin).href);

function localPathFor(url) {
  const parsed = new URL(url);
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === "/") {
    pathname = "/index.html";
  }
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  } else if (!path.posix.extname(pathname)) {
    pathname += "/index.html";
  }
  return path.join(outDir, pathname.replace(/^\/+/, ""));
}

async function fileExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function writeFileWithRetry(target, data, options) {
  let lastError;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await writeFile(target, data, options);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }

  throw lastError;
}

function isLikelyText(contentType, url) {
  return (
    contentType.includes("text/") ||
    contentType.includes("javascript") ||
    contentType.includes("json") ||
    contentType.includes("xml") ||
    /\.(html|css|js|mjs|json|svg|txt|map)$/i.test(new URL(url).pathname)
  );
}

function collectUrls(text, baseUrl) {
  const found = new Set();
  const patterns = [
    /\b(?:src|href|poster)=["']([^"']+)["']/gi,
    /url\((?!['"]?data:)(['"]?)([^'")]+)\1\)/gi,
    /["'`]((?:\/|\.\/|\.\.\/)[^"'`\\]+\.(?:js|css|png|jpe?g|webp|gif|svg|ico|mp3|wav|ogg|m4a|mp4|webm|glb|gltf|ktx2|basis|json|woff2?|ttf|otf)(?:\?[^"'`]*)?)["'`]/gi,
    /["'`](https:\/\/through-sliding-doors\.rosiesplace\.org\.au\/[^"'`\\]+)["'`]/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      const raw = match[2] || match[1];
      if (!raw || raw.startsWith("data:") || raw.startsWith("mailto:") || raw.startsWith("tel:")) {
        continue;
      }
      try {
        const nextUrl = new URL(raw, baseUrl);
        if (nextUrl.origin === origin) {
          found.add(nextUrl.href);
        }
      } catch {
        // Ignore malformed asset-like fragments.
      }
    }
  }
  return [...found];
}

function rewriteText(text) {
  let rewritten = text
    .replaceAll(`${origin}/_next/`, "/tsd-mirror/_next/")
    .replaceAll(`${origin}/favicon.ico`, "/tsd-mirror/favicon.ico")
    .replaceAll(`${origin}/icon.svg`, "/tsd-mirror/icon.svg")
    .replaceAll(`${origin}/textures/`, "/tsd-mirror/textures/")
    .replaceAll(`${origin}/sound/`, "/tsd-mirror/sound/")
    .replaceAll(`${origin}/music/`, "/tsd-mirror/music/")
    .replaceAll(`${origin}/images/`, "/tsd-mirror/images/")
    .replaceAll('href="/', 'href="/tsd-mirror/')
    .replaceAll("href='/", "href='/tsd-mirror/")
    .replaceAll('src="/', 'src="/tsd-mirror/')
    .replaceAll("src='/", "src='/tsd-mirror/")
    .replaceAll('poster="/', 'poster="/tsd-mirror/')
    .replaceAll("poster='/", "poster='/tsd-mirror/")
    .replaceAll('url("/', 'url("/tsd-mirror/')
    .replaceAll("url('/", "url('/tsd-mirror/")
    .replaceAll("url(/", "url(/tsd-mirror/")
    .replaceAll('"/_next/', '"/tsd-mirror/_next/')
    .replaceAll("'/_next/", "'/tsd-mirror/_next/")
    .replaceAll('"/textures/', '"/tsd-mirror/textures/')
    .replaceAll("'/textures/", "'/tsd-mirror/textures/")
    .replaceAll('"/sound/', '"/tsd-mirror/sound/')
    .replaceAll("'/sound/", "'/tsd-mirror/sound/")
    .replaceAll('"/music/', '"/tsd-mirror/music/')
    .replaceAll("'/music/", "'/tsd-mirror/music/")
    .replaceAll('"/images/', '"/tsd-mirror/images/')
    .replaceAll("'/images/", "'/tsd-mirror/images/")
    .replaceAll('"/icon.svg', '"/tsd-mirror/icon.svg')
    .replaceAll('"/favicon.ico', '"/tsd-mirror/favicon.ico');

  const routeTargets = [
    ["/", "/tsd-mirror/index.html"],
    ["/about", "/tsd-mirror/about/index.html"],
    ["/chapter-1", "/tsd-mirror/chapter-1/index.html"],
    ["/chapter-2", "/tsd-mirror/chapter-2/index.html"],
    ["/chapter-3", "/tsd-mirror/chapter-3/index.html"],
    ["/chapter-4", "/tsd-mirror/chapter-4/index.html"],
    ["/chapter-5", "/tsd-mirror/chapter-5/index.html"],
  ];

  for (const [from, to] of routeTargets) {
    rewritten = rewritten
      .replaceAll(`href="${from}"`, `href="${to}"`)
      .replaceAll(`href='${from}'`, `href='${to}'`)
      .replaceAll(`href:${JSON.stringify(from)}`, `href:${JSON.stringify(to)}`)
      .replaceAll(`"href":"${from}"`, `"href":"${to}"`)
      .replaceAll(`'href':'${from}'`, `'href':'${to}'`)
      .replaceAll(`\\\"${from}\\\"`, `\\\"${to}\\\"`);
  }

  return rewritten;
}

async function download(url) {
  if (seen.has(url) || seen.size >= maxDownloads) {
    return;
  }
  seen.add(url);

  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 local mirror for owner editing",
    },
  });

  if (!response.ok) {
    console.warn(`skip ${response.status} ${url}`);
    return;
  }

  const contentType = response.headers.get("content-type") || "";
  const target = localPathFor(url);
  await mkdir(path.dirname(target), { recursive: true });

  if (isLikelyText(contentType, url)) {
    const raw = await response.text();
    for (const assetUrl of collectUrls(raw, url)) {
      if (!seen.has(assetUrl)) {
        queue.push(assetUrl);
      }
    }
    await writeFileWithRetry(target, rewriteText(raw), "utf8");
  } else {
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFileWithRetry(target, bytes);
  }

  console.log(`saved ${url}`);
}

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function remoteUrlForLocalFile(filePath) {
  const relativePath = path.relative(outDir, filePath).replaceAll(path.sep, "/");
  return new URL(relativePath, `${origin}/`).href;
}

function resolveLayerAssetUrl(rawPath, layersFile) {
  let assetPath = rawPath;
  if (assetPath.startsWith("/tsd-mirror/")) {
    assetPath = assetPath.replace(/^\/tsd-mirror\//, "/");
  }

  const layersRemoteUrl = remoteUrlForLocalFile(layersFile);
  return new URL(assetPath, layersRemoteUrl).href;
}

async function downloadHiddenAsset(url) {
  const target = localPathFor(url);
  if (await fileExists(target)) {
    return false;
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 local mirror for owner editing",
    },
  });

  if (!response.ok) {
    console.warn(`skip hidden ${response.status} ${url}`);
    return false;
  }

  await mkdir(path.dirname(target), { recursive: true });
  await writeFileWithRetry(target, Buffer.from(await response.arrayBuffer()));
  console.log(`saved hidden ${url}`);
  return true;
}

function collectLayerFileRefs(layer, refs) {
  if (!layer || typeof layer !== "object") {
    return;
  }

  if (layer.files && typeof layer.files === "object") {
    for (const value of Object.values(layer.files)) {
      if (typeof value === "string") {
        refs.add(value);
      }
    }
  }

  if (Array.isArray(layer.children)) {
    for (const child of layer.children) {
      collectLayerFileRefs(child, refs);
    }
  }

  if (Array.isArray(layer.layers)) {
    for (const child of layer.layers) {
      collectLayerFileRefs(child, refs);
    }
  }
}

function lowTextureUrl(url) {
  return /\.ktx2$/i.test(url) ? url.replace(/\.ktx2$/i, "-low.ktx2") : null;
}

async function downloadHiddenLayerAssets() {
  const files = await walkFiles(outDir);
  const urls = new Set();

  for (const file of files) {
    if (path.basename(file) !== "layers.json") {
      continue;
    }

    try {
      const layerData = JSON.parse(await readFile(file, "utf8"));
      const refs = new Set();
      collectLayerFileRefs(layerData, refs);

      for (const ref of refs) {
        const url = resolveLayerAssetUrl(ref, file);
        urls.add(url);
        const lowUrl = lowTextureUrl(url);
        if (lowUrl) {
          urls.add(lowUrl);
        }
      }
    } catch (error) {
      console.warn(`skip unreadable layers file ${file}: ${error.message}`);
    }
  }

  for (const file of files) {
    if (!/\.ktx2$/i.test(file) || /-low\.ktx2$/i.test(file)) {
      continue;
    }

    const lowUrl = lowTextureUrl(remoteUrlForLocalFile(file));
    if (lowUrl) {
      urls.add(lowUrl);
    }
  }

  let saved = 0;
  for (const url of urls) {
    if (await downloadHiddenAsset(url)) {
      saved += 1;
    }
  }

  console.log(`Checked ${urls.size} hidden layer assets, saved ${saved} missing files`);
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

while (queue.length > 0 && seen.size < maxDownloads) {
  const next = queue.shift();
  await download(next);
}

await downloadHiddenLayerAssets();

const indexPath = path.join(outDir, "index.html");
let index = await readFile(indexPath, "utf8");
index = index.replace(
  "</head>",
  `<base href="/tsd-mirror/">\n<script>window.__TSD_MIRROR__ = true;</script>\n</head>`,
);
await writeFileWithRetry(indexPath, index, "utf8");

console.log(`Mirrored ${seen.size} files into ${outDir}`);
