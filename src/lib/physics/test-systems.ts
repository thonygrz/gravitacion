import type { Body } from "./body";
import { vec2 } from "./vector";

// Two unit masses one unit apart on a circular orbit around their centre of mass:
// each moves at v = √(G·m / (2·d)) = √½ on a circle of radius ½, so T = π·√2.
export const CIRCULAR_BINARY: readonly Body[] = [
  { mass: 1, position: vec2(-0.5, 0), velocity: vec2(0, -Math.SQRT1_2) },
  { mass: 1, position: vec2(0.5, 0), velocity: vec2(0, Math.SQRT1_2) },
];
export const CIRCULAR_BINARY_PERIOD = Math.PI * Math.SQRT2;

// The same pair at about half the circular speed: an eccentric orbit (e ≈ 0.75)
// whose close pericentre passages stress the integrators.
export const ECCENTRIC_BINARY: readonly Body[] = [
  { mass: 1, position: vec2(-0.5, 0), velocity: vec2(0, -0.35) },
  { mass: 1, position: vec2(0.5, 0), velocity: vec2(0, 0.35) },
];

// Two bodies released at rest fall into each other at t = π/4.
export const HEAD_ON: readonly Body[] = [
  { mass: 1, position: vec2(-0.5, 0), velocity: vec2(0, 0) },
  { mass: 1, position: vec2(0.5, 0), velocity: vec2(0, 0) },
];
