import { launchOutcome, type LaunchOutcome } from "../physics/launch";

export interface LabValues {
  readonly mass1: number;
  readonly mass2: number;
  readonly distance: number;
}

interface Limits {
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export const LAB_LIMITS = {
  mass: { min: 1, max: 10, step: 1 },
  distance: { min: 1, max: 10, step: 0.5 },
} as const satisfies Record<string, Limits>;

export const LAB_START: LabValues = { mass1: 4, mass2: 4, distance: 4 };

// Launch speed as a multiple of the circular one; the slider covers fall, orbit and escape.
export const LAUNCH_LIMITS = { min: 0.2, max: 1.6, step: 0.05 } as const satisfies Limits;

// The launcher's star: mass 1 at the origin, with the planet launched from distance 1.
export const STAR_RADIUS = 0.15;

/**
 * Brings a value inside the limits and onto the slider's steps, so a value that does not
 * come from the slider (the tutor's, for one) is one the slider can show.
 */
export function fit(value: number, { min, max, step }: Limits): number {
  const inside = Math.min(max, Math.max(min, value));
  // toFixed drops floating-point leftovers such as 1.2500000000000002.
  return Number((min + Math.round((inside - min) / step) * step).toFixed(6));
}

export function fitLab(values: LabValues, change: Partial<LabValues>): LabValues {
  return {
    mass1: fit(change.mass1 ?? values.mass1, LAB_LIMITS.mass),
    mass2: fit(change.mass2 ?? values.mass2, LAB_LIMITS.mass),
    distance: fit(change.distance ?? values.distance, LAB_LIMITS.distance),
  };
}

export const outcomeOfLaunch = (speed: number): LaunchOutcome =>
  launchOutcome({ starMass: 1, radius: 1, speed }, STAR_RADIUS);
