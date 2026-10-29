import { describe, expect, it } from "vitest";
import { pathData, simplifyPolyline } from "./polyline";

// Smallest distance from (px, py) to any segment of a flat polyline.
function distanceToPolyline(points: number[], px: number, py: number): number {
  let best = Infinity;
  for (let i = 0; i + 3 < points.length; i += 2) {
    const [ax, ay, bx, by] = points.slice(i, i + 4);
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(px - ax - t * dx, py - ay - t * dy));
  }
  return best;
}

describe("simplifyPolyline", () => {
  it("collapses collinear points to the two ends", () => {
    expect(simplifyPolyline([0, 0, 1, 1, 2, 2, 3, 3], 0.01)).toEqual([0, 0, 3, 3]);
  });

  it("keeps corners", () => {
    expect(simplifyPolyline([0, 0, 1, 0, 2, 0, 2, 1, 2, 2], 0.01)).toEqual([0, 0, 2, 0, 2, 2]);
  });

  it("drops a point only when it is within the tolerance", () => {
    expect(simplifyPolyline([0, 0, 1, 0.5, 2, 0], 1)).toEqual([0, 0, 2, 0]);
    expect(simplifyPolyline([0, 0, 1, 0.5, 2, 0], 0.25)).toEqual([0, 0, 1, 0.5, 2, 0]);
  });

  it("leaves lines of one or two points untouched", () => {
    expect(simplifyPolyline([1, 2], 1)).toEqual([1, 2]);
    expect(simplifyPolyline([1, 2, 3, 4], 1)).toEqual([1, 2, 3, 4]);
  });

  it("simplifies a closed loop and stays within the tolerance of every original point", () => {
    const loop: number[] = [];
    for (let i = 0; i <= 500; i++) {
      const angle = (2 * Math.PI * i) / 500;
      loop.push(Math.cos(angle), Math.sin(2 * angle) / 2);
    }
    const tolerance = 1e-3;
    const simplified = simplifyPolyline(loop, tolerance);

    expect(simplified.length).toBeLessThan(loop.length / 3);
    expect(simplified.slice(0, 2)).toEqual(loop.slice(0, 2));
    expect(simplified.slice(-2)).toEqual(loop.slice(-2));
    for (let i = 0; i < loop.length; i += 2) {
      expect(distanceToPolyline(simplified, loop[i], loop[i + 1])).toBeLessThanOrEqual(tolerance);
    }
  });
});

describe("pathData", () => {
  it("writes moves and lines with y flipped and without trailing zeros", () => {
    expect(pathData([0, 0, 1.5, 2, 3, -4.25], 2)).toBe("M0 0L1.5 -2L3 4.25");
  });

  it("rounds to the given decimals and never writes a negative zero", () => {
    expect(pathData([0.123456, 0.0001], 3)).toBe("M0.123 0");
  });
});
