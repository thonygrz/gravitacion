import type { Body } from "./body";
import { simulateAdaptive } from "./dormand-prince";

export function phaseSpaceDistance(
  a: readonly Body[],
  b: readonly Body[],
): number {
  let sum = 0;
  a.forEach((body, i) => {
    const other = b[i];
    sum +=
      (body.position.x - other.position.x) ** 2 +
      (body.position.y - other.position.y) ** 2 +
      (body.velocity.x - other.velocity.x) ** 2 +
      (body.velocity.y - other.velocity.y) ** 2;
  });
  return Math.sqrt(sum);
}

export interface ReturnProximity {
  readonly time: number;
  readonly distance: number;
}

export interface ReturnProximityOptions {
  readonly from: number;
  readonly to: number;
  /** Coarse samples over [from, to] before refining the closest one. */
  readonly samples?: number;
  readonly rtol?: number;
  readonly atol?: number;
}

const GOLDEN = (Math.sqrt(5) - 1) / 2;
const REFINEMENTS = 60;

/**
 * Closest approach to the initial state in phase space within [from, to]: the
 * "return proximity" Šuvakov and Dmitrašinović use to tell periodic orbits apart.
 */
export function returnProximity(
  initial: readonly Body[],
  { from, to, samples = 1000, rtol, atol }: ReturnProximityOptions,
): ReturnProximity {
  if (!(from > 0 && to > from)) {
    throw new RangeError(`expected 0 < from < to, got [${from}, ${to}]`);
  }
  const advance = (bodies: readonly Body[], duration: number) =>
    duration <= 0
      ? bodies
      : simulateAdaptive(bodies, { duration, samples: 1, rtol, atol })[1].bodies;

  const start = advance(initial, from);
  const coarse = simulateAdaptive(start, { duration: to - from, samples, rtol, atol });
  let closest = 0;
  let closestDistance = Infinity;
  coarse.forEach((sample, i) => {
    const distance = phaseSpaceDistance(sample.bodies, initial);
    if (distance < closestDistance) {
      closest = i;
      closestDistance = distance;
    }
  });

  // The minimum lies between the neighbours of the closest sample; a golden-section
  // search narrows it down, integrating each probe from the earlier neighbour.
  const origin = coarse[Math.max(0, closest - 1)];
  const distanceAt = (time: number) =>
    phaseSpaceDistance(advance(origin.bodies, time - origin.time), initial);
  let lo = origin.time;
  let hi = coarse[Math.min(coarse.length - 1, closest + 1)].time;
  let left = hi - GOLDEN * (hi - lo);
  let right = lo + GOLDEN * (hi - lo);
  let fLeft = distanceAt(left);
  let fRight = distanceAt(right);
  for (let i = 0; i < REFINEMENTS; i++) {
    if (fLeft < fRight) {
      hi = right;
      right = left;
      fRight = fLeft;
      left = hi - GOLDEN * (hi - lo);
      fLeft = distanceAt(left);
    } else {
      lo = left;
      left = right;
      fLeft = fRight;
      right = lo + GOLDEN * (hi - lo);
      fRight = distanceAt(right);
    }
  }
  const time = (lo + hi) / 2;
  return { time: from + time, distance: distanceAt(time) };
}
