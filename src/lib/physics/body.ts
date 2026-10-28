import type { Vec2 } from "./vector";

export interface Body {
  readonly mass: number;
  readonly position: Vec2;
  readonly velocity: Vec2;
}
