import { describe, expect, it } from "vitest";
import type { Body } from "../physics/body";
import { simulateAdaptive } from "../physics/dormand-prince";
import { totalEnergy } from "../physics/gravity";
import { returnProximity } from "../physics/periodicity";
import { findOrbit, ORBITS } from "./catalog";

// Phase-space distance at the return, limited by the digits each source publishes
// (measured on 27/10/2026, with about a 5x margin). Lagrange is exact, so only the
// integration tolerance limits it.
const MAX_CLOSURE: Record<string, number> = {
  lagrange: 1e-8,
  "figura-de-ocho": 5e-6,
  "butterfly-i": 2e-5,
  goggles: 1e-4,
  "moth-i": 1e-3,
  "yin-yang-i": 1e-3,
};

describe("orbit catalog", () => {
  it("lists the six requested orbits in order, with unique slugs", () => {
    expect(ORBITS.map((orbit) => orbit.name)).toEqual([
      "Lagrange",
      "Figura de ocho",
      "Butterfly I",
      "Goggles",
      "Moth I",
      "Yin-Yang I",
    ]);
    expect(new Set(ORBITS.map((orbit) => orbit.slug)).size).toBe(ORBITS.length);
  });

  it("finds an orbit by its slug", () => {
    expect(findOrbit("moth-i")?.name).toBe("Moth I");
    expect(findOrbit("no-existe")).toBeUndefined();
  });
});

describe.each(ORBITS)("$name", (orbit) => {
  it("starts with the centre of mass at rest at the origin", () => {
    const total = (pick: (body: Body) => number) =>
      orbit.initialBodies.reduce((sum, body) => sum + pick(body), 0);
    expect(total((b) => b.mass * b.velocity.x)).toBeCloseTo(0, 12);
    expect(total((b) => b.mass * b.velocity.y)).toBeCloseTo(0, 12);
    expect(total((b) => b.mass * b.position.x)).toBeCloseTo(0, 12);
    expect(total((b) => b.mass * b.position.y)).toBeCloseTo(0, 12);
  });

  it("conserves energy over one period", () => {
    const e0 = totalEnergy(orbit.initialBodies);
    const samples = simulateAdaptive(orbit.initialBodies, {
      duration: orbit.period,
      samples: 1000,
    });
    const maxError = Math.max(
      ...samples.map((sample) => Math.abs((totalEnergy(sample.bodies) - e0) / e0)),
    );
    expect(maxError).toBeLessThan(5e-8);
  });

  it("returns to its initial state after one period", () => {
    const { time, distance } = returnProximity(orbit.initialBodies, {
      from: 0.99 * orbit.period,
      to: 1.01 * orbit.period,
    });
    expect(Math.abs(time - orbit.period)).toBeLessThan(1e-5);
    expect(distance).toBeLessThan(MAX_CLOSURE[orbit.slug]);
  });

  it.runIf(orbit.publishedPeriod !== undefined)(
    "agrees with the published period to within 2·10⁻³",
    () => {
      expect(Math.abs(orbit.period - (orbit.publishedPeriod ?? Number.NaN))).toBeLessThan(2e-3);
    },
  );
});
