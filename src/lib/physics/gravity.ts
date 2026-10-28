import type { Body } from "./body";
import { length, sub, vec2, type Vec2 } from "./vector";

// The published periodic orbits use units where G = 1 and every mass is 1.
export const G = 1;

/** Newton's law of universal gravitation: F = G · m1 · m2 / r². */
export function gravitationalForce(
  m1: number,
  m2: number,
  distance: number,
  g = G,
): number {
  return (g * m1 * m2) / (distance * distance);
}

export function accelerations(bodies: readonly Body[], g = G): Vec2[] {
  return bodies.map((body, i) => {
    let ax = 0;
    let ay = 0;
    for (let j = 0; j < bodies.length; j++) {
      if (j === i) continue;
      const other = bodies[j];
      const dx = other.position.x - body.position.x;
      const dy = other.position.y - body.position.y;
      const r2 = dx * dx + dy * dy;
      // |a| = G · m / r² along the unit offset, so the offset is scaled by G · m / r³.
      const k = (g * other.mass) / (r2 * Math.sqrt(r2));
      ax += k * dx;
      ay += k * dy;
    }
    return vec2(ax, ay);
  });
}

export function kineticEnergy(bodies: readonly Body[]): number {
  return bodies.reduce(
    (sum, { mass, velocity }) =>
      sum + 0.5 * mass * (velocity.x * velocity.x + velocity.y * velocity.y),
    0,
  );
}

export function potentialEnergy(bodies: readonly Body[], g = G): number {
  let energy = 0;
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const distance = length(sub(bodies[i].position, bodies[j].position));
      energy -= (g * bodies[i].mass * bodies[j].mass) / distance;
    }
  }
  return energy;
}

export const totalEnergy = (bodies: readonly Body[], g = G): number =>
  kineticEnergy(bodies) + potentialEnergy(bodies, g);
