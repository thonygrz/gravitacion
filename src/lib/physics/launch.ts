import { G } from "./gravity";

/** A planet launched perpendicular to the line that joins it to a star at rest. */
export interface Launch {
  readonly starMass: number;
  /** Distance from the star at launch. */
  readonly radius: number;
  readonly speed: number;
}

export type LaunchOutcome =
  | { readonly kind: "escape" }
  | { readonly kind: "collision"; readonly closest: number }
  | {
      readonly kind: "orbit";
      readonly closest: number;
      readonly farthest: number;
      readonly period: number;
    };

/** Speed that keeps a planet on a circle of the given radius. */
export const circularSpeed = (starMass: number, radius: number, g = G): number =>
  Math.sqrt((g * starMass) / radius);

/** Slowest speed that never comes back: √2 times the circular one. */
export const escapeSpeed = (starMass: number, radius: number, g = G): number =>
  Math.sqrt((2 * g * starMass) / radius);

/**
 * What the planet does, from its energy and angular momentum. With energy zero or
 * above it escapes. Otherwise it moves on an ellipse with the launch point as one apsis
 * (the launch is perpendicular to the radius) and r·v² / (2GM/r − v²) as the other;
 * it collides when that apsis falls inside the star.
 */
export function launchOutcome({ starMass, radius, speed }: Launch, starRadius: number, g = G): LaunchOutcome {
  const mu = g * starMass;
  const bindingSpeedSquared = (2 * mu) / radius - speed * speed;
  if (bindingSpeedSquared <= 0) return { kind: "escape" };

  const otherApsis = (radius * speed * speed) / bindingSpeedSquared;
  const closest = Math.min(radius, otherApsis);
  const farthest = Math.max(radius, otherApsis);
  if (closest <= starRadius) return { kind: "collision", closest };

  // Kepler's third law with the semi-major axis of the ellipse.
  const semiMajorAxis = (closest + farthest) / 2;
  return { kind: "orbit", closest, farthest, period: 2 * Math.PI * Math.sqrt(semiMajorAxis ** 3 / mu) };
}
