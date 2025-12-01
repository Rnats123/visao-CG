export function openUniformKnot(nCP, p) {
  const knot = [];
  const m = nCP + p;

  for (let i = 0; i <= p; i++) knot.push(0);

  const interior = m - 2 * p;
  for (let i = 1; i < interior; i++) {
    knot.push(i / interior);
  }

  for (let i = 0; i <= p; i++) knot.push(1);

  return knot;
}

function findSpan(nCP, p, t, U) {
  const n = nCP - 1;
  if (t >= U[n + 1]) return n;
  if (t <= U[p]) return p;

  let low = p, high = n + 1;
  let mid = Math.floor((low + high) / 2);

  while (t < U[mid] || t >= U[mid + 1]) {
    if (t < U[mid]) high = mid;
    else low = mid;
    mid = Math.floor((low + high) / 2);
  }
  return mid;
}

export function deBoor(points, p, U, t) {
  const nCP = points.length;
  if (nCP < p + 1) return null;

  const k = findSpan(nCP, p, t, U);

  const d = [];
  for (let j = 0; j <= p; j++) {
    d[j] = { x: points[k - p + j].x, y: points[k - p + j].y };
  }

  for (let r = 1; r <= p; r++) {
    for (let j = p; j >= r; j--) {
      const i = k - p + j;
      const denom = U[i + p - r + 1] - U[i];
      const alpha = denom === 0 ? 0 : (t - U[i]) / denom;

      d[j] = {
        x: (1 - alpha) * d[j - 1].x + alpha * d[j].x,
        y: (1 - alpha) * d[j - 1].y + alpha * d[j].y
      };
    }
  }

  return d[p];
}
