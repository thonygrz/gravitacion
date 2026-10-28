import { describe, expect, it } from "vitest";
import { simulateAdaptive } from "./dormand-prince";
import { totalEnergy } from "./gravity";
import { phaseSpaceDistance } from "./periodicity";
import {
  CIRCULAR_BINARY,
  CIRCULAR_BINARY_PERIOD,
  ECCENTRIC_BINARY,
  HEAD_ON,
} from "./test-systems";

const closure = (rtol: number) =>
  phaseSpaceDistance(
    simulateAdaptive(CIRCULAR_BINARY, {
      duration: CIRCULAR_BINARY_PERIOD,
      samples: 1,
      rtol,
      atol: rtol / 100,
    })[1].bodies,
    CIRCULAR_BINARY,
  );

describe("simulateAdaptive", () => {
  it("lands exactly on evenly spaced sample times", () => {
    const samples = simulateAdaptive(CIRCULAR_BINARY, {
      duration: CIRCULAR_BINARY_PERIOD,
      samples: 8,
    });
    expect(samples).toHaveLength(9);
    samples.forEach((sample, i) => {
      expect(sample.time).toBe((i * CIRCULAR_BINARY_PERIOD) / 8);
    });
  });

  it("brings a circular binary back to its start after one period", () => {
    expect(closure(1e-10)).toBeLessThan(5e-9);
  });

  it("gets more accurate as the tolerance tightens", () => {
    expect(closure(1e-10)).toBeLessThan(closure(1e-6) / 1000);
  });

  it("conserves the energy of an eccentric orbit through its close passages", () => {
    const e0 = totalEnergy(ECCENTRIC_BINARY);
    const samples = simulateAdaptive(ECCENTRIC_BINARY, { duration: 20, samples: 200 });
    const maxError = Math.max(
      ...samples.map((sample) => Math.abs((totalEnergy(sample.bodies) - e0) / e0)),
    );
    expect(maxError).toBeLessThan(2e-8);
  });

  it("stops with an error at the collision time instead of looping", () => {
    // Two bodies released at rest one unit apart collide at t = π/4.
    expect(() => simulateAdaptive(HEAD_ON, { duration: 1, samples: 1 })).toThrow(
      /at t = 0\.785398\d*: the bodies probably collided/,
    );
  });

  it("rejects a non-positive duration or a fractional sample count", () => {
    expect(() => simulateAdaptive(CIRCULAR_BINARY, { duration: 0, samples: 1 })).toThrow(RangeError);
    expect(() => simulateAdaptive(CIRCULAR_BINARY, { duration: 1, samples: 1.5 })).toThrow(RangeError);
  });
});
