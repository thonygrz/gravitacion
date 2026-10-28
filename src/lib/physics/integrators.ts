import type { Body } from "./body";
import { accelerations, G } from "./gravity";
import { add, scale } from "./vector";

/** Advances a system by one fixed time step `dt`. */
export type Integrator = (
  bodies: readonly Body[],
  dt: number,
  g?: number,
) => Body[];

const drift = (bodies: readonly Body[], h: number): Body[] =>
  bodies.map((body) => ({
    ...body,
    position: add(body.position, scale(body.velocity, h)),
  }));

const kick = (bodies: readonly Body[], h: number, g: number): Body[] => {
  const acc = accelerations(bodies, g);
  return bodies.map((body, i) => ({
    ...body,
    velocity: add(body.velocity, scale(acc[i], h)),
  }));
};

// Yoshida (1990): a fourth-order composition of leapfrog steps. Being symplectic,
// its energy error oscillates instead of accumulating, which is what a live
// simulation that runs indefinitely needs. Three force evaluations per step.
const CBRT2 = Math.cbrt(2);
const W1 = 1 / (2 - CBRT2);
const W0 = -CBRT2 / (2 - CBRT2);
const DRIFTS = [W1 / 2, (W0 + W1) / 2, (W0 + W1) / 2, W1 / 2] as const;
const KICKS = [W1, W0, W1] as const;

export const yoshida4: Integrator = (bodies, dt, g = G) => {
  let state = drift(bodies, DRIFTS[0] * dt);
  for (let stage = 0; stage < KICKS.length; stage++) {
    state = kick(state, KICKS[stage] * dt, g);
    state = drift(state, DRIFTS[stage + 1] * dt);
  }
  return state;
};
