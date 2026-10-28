export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });

export const add = (a: Vec2, b: Vec2): Vec2 => vec2(a.x + b.x, a.y + b.y);

export const sub = (a: Vec2, b: Vec2): Vec2 => vec2(a.x - b.x, a.y - b.y);

export const scale = (v: Vec2, k: number): Vec2 => vec2(v.x * k, v.y * k);

export const length = (v: Vec2): number => Math.hypot(v.x, v.y);
