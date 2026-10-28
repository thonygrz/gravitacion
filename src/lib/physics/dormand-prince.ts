import type { Body } from "./body";
import { accelerations, G } from "./gravity";
import type { Sample } from "./simulation";
import { vec2 } from "./vector";

// Dormand-Prince 5(4) tableau, the one SciPy uses in RK45 (Hairer, Nørsett and
// Wanner, "Solving Ordinary Differential Equations I", section II.4).
const C = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1] as const;
const A: readonly (readonly number[])[] = [
  [],
  [1 / 5],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
];
const B = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84] as const;
// Weights of the embedded error estimate; the seventh stage is the derivative
// at the new point, which the next step reuses as its first stage.
const E = [
  -71 / 57600, 0, 71 / 16695, -71 / 1920, 17253 / 339200, -22 / 525, 1 / 40,
] as const;

// Step-size control, also as in SciPy.
const SAFETY = 0.9;
const MIN_FACTOR = 0.2;
const MAX_FACTOR = 10;
const ERROR_EXPONENT = -1 / 5;
const MIN_STEP = 1e-12;

export interface AdaptiveOptions {
  readonly duration: number;
  /** Evenly spaced intervals to record; the solver lands exactly on each one. */
  readonly samples: number;
  /** Relative tolerance of the local error of each step. */
  readonly rtol?: number;
  /** Absolute tolerance of the local error of each step. */
  readonly atol?: number;
  readonly g?: number;
}

// State layout: all positions first, then all velocities, as [x0, y0, x1, y1, ...].
function toState(bodies: readonly Body[]): Float64Array {
  const n = bodies.length;
  const y = new Float64Array(4 * n);
  bodies.forEach(({ position, velocity }, i) => {
    y[2 * i] = position.x;
    y[2 * i + 1] = position.y;
    y[2 * n + 2 * i] = velocity.x;
    y[2 * n + 2 * i + 1] = velocity.y;
  });
  return y;
}

function toBodies(y: Float64Array, masses: readonly number[]): Body[] {
  const n = masses.length;
  return masses.map((mass, i) => ({
    mass,
    position: vec2(y[2 * i], y[2 * i + 1]),
    velocity: vec2(y[2 * n + 2 * i], y[2 * n + 2 * i + 1]),
  }));
}

function derivative(
  y: Float64Array,
  masses: readonly number[],
  g: number,
): Float64Array {
  const n = masses.length;
  const dy = new Float64Array(4 * n);
  dy.set(y.subarray(2 * n), 0);
  accelerations(toBodies(y, masses), g).forEach((a, i) => {
    dy[2 * n + 2 * i] = a.x;
    dy[2 * n + 2 * i + 1] = a.y;
  });
  return dy;
}

interface StepResult {
  readonly y: Float64Array;
  readonly f: Float64Array;
  readonly errorNorm: number;
}

function step(
  y: Float64Array,
  f: Float64Array,
  h: number,
  masses: readonly number[],
  g: number,
  rtol: number,
  atol: number,
): StepResult {
  const k: Float64Array[] = [f];
  for (let s = 1; s < C.length; s++) {
    const ys = Float64Array.from(y);
    A[s].forEach((a, j) => {
      for (let i = 0; i < ys.length; i++) ys[i] += h * a * k[j][i];
    });
    k.push(derivative(ys, masses, g));
  }

  const yNew = Float64Array.from(y);
  B.forEach((b, j) => {
    for (let i = 0; i < yNew.length; i++) yNew[i] += h * b * k[j][i];
  });
  const fNew = derivative(yNew, masses, g);
  k.push(fNew);

  let sum = 0;
  for (let i = 0; i < y.length; i++) {
    let error = 0;
    E.forEach((e, j) => {
      error += e * k[j][i];
    });
    const scale = atol + Math.max(Math.abs(y[i]), Math.abs(yNew[i])) * rtol;
    sum += ((h * error) / scale) ** 2;
  }
  return { y: yNew, f: fNew, errorNorm: Math.sqrt(sum / y.length) };
}

/**
 * Integrates with Dormand-Prince 5(4) and error control: the step shrinks only
 * where the bodies come close. Returns `samples + 1` evenly spaced states.
 */
export function simulateAdaptive(
  initial: readonly Body[],
  { duration, samples, rtol = 1e-10, atol = 1e-12, g = G }: AdaptiveOptions,
): Sample[] {
  if (!(duration > 0)) {
    throw new RangeError(`duration must be positive, got ${duration}`);
  }
  if (!Number.isInteger(samples) || samples < 1) {
    throw new RangeError(`samples must be a positive integer, got ${samples}`);
  }

  const masses = initial.map((body) => body.mass);
  let y = toState(initial);
  let f = derivative(y, masses, g);
  let t = 0;
  let h = duration / samples;
  let rejected = false;
  const result: Sample[] = [{ time: 0, bodies: initial }];

  for (let index = 1; index <= samples; index++) {
    const target = (index * duration) / samples;
    while (t < target) {
      const clamped = target - t <= h;
      const dt = clamped ? target - t : h;
      const attempt = step(y, f, dt, masses, g, rtol, atol);

      if (attempt.errorNorm < 1) {
        t = clamped ? target : t + dt;
        y = attempt.y;
        f = attempt.f;
        // A step cut short to land on a sample says nothing about the right size.
        if (!clamped) {
          const factor =
            attempt.errorNorm === 0
              ? MAX_FACTOR
              : Math.min(MAX_FACTOR, SAFETY * attempt.errorNorm ** ERROR_EXPONENT);
          h = dt * (rejected ? Math.min(1, factor) : factor);
        }
        rejected = false;
      } else {
        // A non-finite error (two bodies on top of each other) shrinks the step too.
        const factor = Number.isFinite(attempt.errorNorm)
          ? Math.max(MIN_FACTOR, SAFETY * attempt.errorNorm ** ERROR_EXPONENT)
          : MIN_FACTOR;
        h = dt * factor;
        rejected = true;
        if (h < MIN_STEP) {
          throw new RangeError(
            `step size fell below ${MIN_STEP} at t = ${t}: the bodies probably collided`,
          );
        }
      }
    }
    result.push({ time: target, bodies: toBodies(y, masses) });
  }
  return result;
}
