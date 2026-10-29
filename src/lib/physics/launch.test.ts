import { describe, expect, it } from "vitest";
import type { Body } from "./body";
import { circularSpeed, escapeSpeed, launchOutcome } from "./launch";
import { simulate } from "./simulation";
import { length, sub, vec2 } from "./vector";

const STAR_RADIUS = 0.15;

// A star of mass 1 at rest and a planet so light that the star barely moves.
const launchBodies = (speed: number): Body[] => [
  { mass: 1, position: vec2(0, 0), velocity: vec2(0, 0) },
  { mass: 1e-9, position: vec2(1, 0), velocity: vec2(0, speed) },
];

describe("circular and escape speeds", () => {
  it("follow v² = GM/r, with the escape speed √2 times the circular one", () => {
    expect(circularSpeed(4, 1)).toBeCloseTo(2, 12);
    expect(circularSpeed(1, 4)).toBeCloseTo(0.5, 12);
    expect(escapeSpeed(1, 1) / circularSpeed(1, 1)).toBeCloseTo(Math.SQRT2, 12);
  });
});

describe("launchOutcome", () => {
  it("keeps a planet at the circular speed on a circle with Kepler's period", () => {
    const outcome = launchOutcome({ starMass: 1, radius: 1, speed: 1 }, STAR_RADIUS);
    expect(outcome.kind).toBe("orbit");
    if (outcome.kind !== "orbit") return;
    expect(outcome.closest).toBeCloseTo(1, 12);
    expect(outcome.farthest).toBeCloseTo(1, 12);
    expect(outcome.period).toBeCloseTo(2 * Math.PI, 12);
  });

  it("lets the planet escape from the escape speed on, and not just below it", () => {
    expect(launchOutcome({ starMass: 1, radius: 1, speed: Math.SQRT2 }, STAR_RADIUS).kind).toBe("escape");
    expect(launchOutcome({ starMass: 1, radius: 1, speed: 1.5 }, STAR_RADIUS).kind).toBe("escape");
    expect(launchOutcome({ starMass: 1, radius: 1, speed: 1.41 }, STAR_RADIUS).kind).toBe("orbit");
  });

  it("makes a slow planet fall into the star", () => {
    // Other apsis: 0.4² / (2 − 0.4²) = 0.087, inside the star.
    const outcome = launchOutcome({ starMass: 1, radius: 1, speed: 0.4 }, STAR_RADIUS);
    expect(outcome).toEqual({ kind: "collision", closest: expect.closeTo(0.16 / 1.84, 12) });
    expect(launchOutcome({ starMass: 1, radius: 1, speed: 0 }, STAR_RADIUS).kind).toBe("collision");
  });

  it("agrees with a numerical integration on the closest approach and the period", () => {
    const speed = 0.8;
    const outcome = launchOutcome({ starMass: 1, radius: 1, speed }, STAR_RADIUS);
    if (outcome.kind !== "orbit") throw new Error(`expected an orbit, got ${outcome.kind}`);

    const samples = simulate(launchBodies(speed), { duration: outcome.period, steps: 40_000, samples: 40_000 });
    const distances = samples.map(({ bodies }) => length(sub(bodies[1].position, bodies[0].position)));
    expect(Math.min(...distances)).toBeCloseTo(outcome.closest, 5);
    expect(Math.max(...distances)).toBeCloseTo(outcome.farthest, 5);
    const back = samples[samples.length - 1].bodies[1].position;
    expect(length(sub(back, vec2(1, 0)))).toBeLessThan(1e-6);
  });
});
