import { describe, expect, it } from "vitest";
import { boundsOf } from "../plot/viewport";
import { findOrbit } from "./catalog";
import { orbitFigure } from "./figure";
import { computeTrajectory } from "./trajectory";

describe("orbitFigure", () => {
  // Lagrange's bodies start off the x axis, so flipping y shows in every coordinate.
  const orbit = findOrbit("lagrange");
  if (!orbit) throw new Error("the catalog lost Lagrange's orbit");
  const trajectory = computeTrajectory(orbit.initialBodies, orbit.period, 2000);
  const figure = orbitFigure(trajectory);

  it("draws one simplified path per body", () => {
    expect(figure.paths).toHaveLength(3);
    for (const path of figure.paths) {
      expect(path.startsWith("M")).toBe(true);
      const points = path.split(/[ML]/).filter(Boolean).length;
      expect(points).toBeGreaterThan(20);
      expect(points).toBeLessThan(2001 / 4);
    }
  });

  it("marks where each body starts, with y flipped", () => {
    expect(figure.starts).toEqual(
      orbit.initialBodies.map(({ position }) => ({ x: position.x, y: -position.y })),
    );
    expect(figure.starts[0].y).toBeCloseTo(-1, 12);
  });

  it("frames every position inside the view box, with y flipped", () => {
    const bounds = boundsOf(trajectory.positions);
    const { x, y, width, height } = figure.viewBox;
    expect(x).toBeLessThan(bounds.minX);
    expect(x + width).toBeGreaterThan(bounds.maxX);
    expect(y).toBeLessThan(-bounds.maxY);
    expect(y + height).toBeGreaterThan(-bounds.minY);
  });
});
