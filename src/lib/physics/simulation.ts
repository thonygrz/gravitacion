import type { Body } from "./body";
import { G } from "./gravity";
import { yoshida4, type Integrator } from "./integrators";

export interface SimulationOptions {
  readonly duration: number;
  /** Fixed integration steps; the step size is `duration / steps`. */
  readonly steps: number;
  /** Evenly spaced intervals to record; must divide `steps`. */
  readonly samples: number;
  readonly integrator?: Integrator;
  readonly g?: number;
}

export interface Sample {
  readonly time: number;
  readonly bodies: readonly Body[];
}

/** Integrates from t = 0 to `duration` and returns `samples + 1` states, both ends included. */
export function simulate(
  initial: readonly Body[],
  { duration, steps, samples, integrator = yoshida4, g = G }: SimulationOptions,
): Sample[] {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new RangeError(`steps must be a positive integer, got ${steps}`);
  }
  if (!Number.isInteger(samples) || samples < 1 || steps % samples !== 0) {
    throw new RangeError(`samples (${samples}) must divide steps (${steps})`);
  }

  const dt = duration / steps;
  const stride = steps / samples;
  const result: Sample[] = [{ time: 0, bodies: initial }];
  let state = initial;
  for (let step = 1; step <= steps; step++) {
    state = integrator(state, dt, g);
    if (step % stride === 0) result.push({ time: step * dt, bodies: state });
  }
  return result;
}
