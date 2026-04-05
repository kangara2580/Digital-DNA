/** 장바구니까지 나선·물결 섞인 이동 경로 (화면 좌표, 중심점 기준) */

export function buildDopamineSpiralPath(
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  steps: number,
): { xs: number[]; ys: number[] } {
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const xs: number[] = [];
  const ys: number[] = [];
  const n = Math.max(8, steps);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const bx = sx + dx * t;
    const by = sy + dy * t;
    const envelope = Math.sin(Math.PI * t) ** 1.12;
    const spiral =
      Math.sin(t * Math.PI * 3.45) * 34 * envelope +
      Math.sin(t * Math.PI * 1.55) * 11 * envelope +
      Math.sin(t * Math.PI * 5.1) * 6 * envelope;
    xs.push(bx + px * spiral);
    ys.push(by + py * spiral);
  }
  return { xs, ys };
}
