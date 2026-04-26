#!/usr/bin/env bash
# 에이전트 세션이 끝날 때(stop) 사용자 Mac에서 실행됩니다.
# 챗 안 샌드박스가 아니라 로컬이라 GitHub 푸시가 됩니다.
set +e
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
[[ -d .git ]] || exit 0
git remote get-url origin >/dev/null 2>&1 || exit 0
git fetch origin main --quiet 2>/dev/null || true
if git status -sb 2>/dev/null | grep -q '\[ahead'; then
  git push origin main
fi
exit 0
