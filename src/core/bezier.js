export function deCasteljau(points, t) {
  if (points.length === 0) return null;

  let temp = points.map(p => ({
    x: p.x * p.w,
    y: p.y * p.w,
    w: p.w
  }));

  const n = temp.length;
  for (let r = 1; r < n; r++) {
    for (let i = 0; i < n - r; i++) {
      temp[i] = {
        x: (1 - t) * temp[i].x + t * temp[i + 1].x,
        y: (1 - t) * temp[i].y + t * temp[i + 1].y,
        w: (1 - t) * temp[i].w + t * temp[i + 1].w
      };
    }
  }

  const P = temp[0];
  return { x: P.x / P.w, y: P.y / P.w };
}
