import { describe, expect, it } from "vitest";
import type { Body } from "./body";
import {
  accelerations,
  gravitationalForce,
  kineticEnergy,
  potentialEnergy,
  totalEnergy,
} from "./gravity";
import { vec2 } from "./vector";

const body = (mass: number, x: number, y: number, vx = 0, vy = 0): Body => ({
  mass,
  position: vec2(x, y),
  velocity: vec2(vx, vy),
});

describe("gravitationalForce", () => {
  it("falls to a quarter when the distance doubles", () => {
    expect(gravitationalForce(3, 5, 2) / gravitationalForce(3, 5, 1)).toBeCloseTo(0.25, 12);
  });

  it("is proportional to each mass", () => {
    expect(gravitationalForce(6, 5, 2) / gravitationalForce(3, 5, 2)).toBeCloseTo(2, 12);
  });
});

describe("accelerations", () => {
  it("pulls two bodies toward each other with equal and opposite forces", () => {
    const [a1, a2] = accelerations([body(2, 0, 0), body(3, 4, 0)]);
    // |a1| = G·m2/r² = 3/16 toward +x and |a2| = G·m1/r² = 2/16 toward -x.
    expect(a1.x).toBeCloseTo(3 / 16, 12);
    expect(a2.x).toBeCloseTo(-2 / 16, 12);
    expect(a1.y).toBeCloseTo(0, 12);
    expect(2 * a1.x + 3 * a2.x).toBeCloseTo(0, 12);
  });

  it("adds up the pull of every other body", () => {
    const [middle] = accelerations([body(1, 0, 0), body(1, -1, 0), body(1, 1, 0)]);
    expect(middle.x).toBeCloseTo(0, 12);
    expect(middle.y).toBeCloseTo(0, 12);
  });
});

describe("energy", () => {
  it("adds kinetic and gravitational potential energy", () => {
    const bodies = [body(2, 0, 0, 3, 4), body(1, 0, 2)];
    expect(kineticEnergy(bodies)).toBeCloseTo(25, 12);
    expect(potentialEnergy(bodies)).toBeCloseTo(-1, 12);
    expect(totalEnergy(bodies)).toBeCloseTo(24, 12);
  });
});
