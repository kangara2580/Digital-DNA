const major = Number(process.versions.node.split(".")[0] ?? "0");
const strict = process.env.ENFORCE_NODE_LTS === "true";

if (major !== 22) {
  const msg = [
    "[dev] 현재 Node 버전은 권장 범위를 벗어났습니다.",
    `[dev] detected: v${process.versions.node}`,
    "[dev] recommended: v22.x (LTS)",
    "[dev] 실행: nvm install 22 && nvm use 22",
  ].join("\n");

  if (strict) {
    console.error(msg);
    process.exit(1);
  }

  console.warn(
    [
      msg,
      "[dev] 계속 진행합니다. (강제 차단하려면 ENFORCE_NODE_LTS=true 설정)",
    ].join("\n"),
  );
}

