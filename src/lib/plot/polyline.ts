// Distance from point i to the segment between points a and b of a flat polyline.
// A segment, not a line: in a closed loop the first and last points coincide.
function distanceToSegment(points: ArrayLike<number>, i: number, a: number, b: number): number {
  const ax = points[2 * a];
  const ay = points[2 * a + 1];
  const dx = points[2 * b] - ax;
  const dy = points[2 * b + 1] - ay;
  const px = points[2 * i] - ax;
  const py = points[2 * i + 1] - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (px * dx + py * dy) / lengthSquared));
  return Math.hypot(px - t * dx, py - t * dy);
}

/**
 * Ramer-Douglas-Peucker simplification of a flat [x0, y0, x1, y1, ...] polyline: keeps
 * both ends and every point needed for the result to stay within `tolerance` of the
 * original.
 */
export function simplifyPolyline(points: ArrayLike<number>, tolerance: number): number[] {
  const count = points.length / 2;
  if (count <= 2) return Array.from(points);

  const keep = new Uint8Array(count);
  keep[0] = 1;
  keep[count - 1] = 1;
  // An explicit stack instead of recursion: a 6000-point orbit could nest deeply.
  const pending: (readonly [number, number])[] = [[0, count - 1]];
  for (let range = pending.pop(); range; range = pending.pop()) {
    const [first, last] = range;
    let farthest = -1;
    let farthestDistance = tolerance;
    for (let i = first + 1; i < last; i++) {
      const distance = distanceToSegment(points, i, first, last);
      if (distance > farthestDistance) {
        farthest = i;
        farthestDistance = distance;
      }
    }
    if (farthest !== -1) {
      keep[farthest] = 1;
      pending.push([first, farthest], [farthest, last]);
    }
  }

  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    if (keep[i]) result.push(points[2 * i], points[2 * i + 1]);
  }
  return result;
}

// Fixed decimals without trailing zeros; Number() also turns "-0" into "0".
const formatCoordinate = (value: number, decimals: number): string =>
  String(Number(value.toFixed(decimals)));

/** SVG path data for a flat polyline in world coordinates, with y flipped to point up. */
export function pathData(points: ArrayLike<number>, decimals: number): string {
  let d = "";
  for (let i = 0; i < points.length; i += 2) {
    d += `${i === 0 ? "M" : "L"}${formatCoordinate(points[i], decimals)} ${formatCoordinate(-points[i + 1], decimals)}`;
  }
  return d;
}
