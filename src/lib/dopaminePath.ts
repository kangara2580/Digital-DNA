/**
 * 장바구니까지: 나선/지그재그 없이, 위로 볼록한 3차 베지어 곡선
 * (우상향 차트처럼 매끈한 호만).
 */

export function buildElasticArcPath(
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  steps: number,
): { xs: number[]; ys: number[]; rotations: number[] } {
  const dx = ex - sx;
  const dy = ey - sy;
  const dist = Math.hypot(dx, dy) || 1;
  /** 화면 위쪽으로 볼록하게 (y 감소) */
  const lift = Math.min(150, dist * 0.36);

  const p0 = { x: sx, y: sy };
  const p3 = { x: ex, y: ey };
  const p1 = {
    x: sx + dx * 0.22,
    y: sy + dy * 0.22 - lift * 0.88,
  };
  const p2 = {
    x: sx + dx * 0.58,
    y: sy + dy * 0.58 - lift * 1.02,
  };

  const n = Math.max(16, steps);
  const xs: number[] = [];
  const ys: number[] = [];
  const rotations: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const u = 1 - t;
    const x =
      u ** 3 * p0.x +
      3 * u ** 2 * t * p1.x +
      3 * u * t ** 2 * p2.x +
      t ** 3 * p3.x;
    const y =
      u ** 3 * p0.y +
      3 * u ** 2 * t * p1.y +
      3 * u * t ** 2 * p2.y +
      t ** 3 * p3.y;
    xs.push(x);
    ys.push(y);

    const dxdt =
      3 * u ** 2 * (p1.x - p0.x) +
      6 * u * t * (p2.x - p1.x) +
      3 * t ** 2 * (p3.x - p2.x);
    const dydt =
      3 * u ** 2 * (p1.y - p0.y) +
      6 * u * t * (p2.y - p1.y) +
      3 * t ** 2 * (p3.y - p2.y);
    const deg = (Math.atan2(dydt, dxdt) * 180) / Math.PI;
    rotations.push(deg * 0.12 + 1.5);
  }

  return { xs, ys, rotations };
}
