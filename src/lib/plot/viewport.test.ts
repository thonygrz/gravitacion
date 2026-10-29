import { describe, expect, it } from "vitest";
import { boundsOf, fitViewBox, toScreenX, toScreenY, viewBoxAround } from "./viewport";

describe("boundsOf", () => {
  it("covers every point of every polyline", () => {
    expect(boundsOf([[0, 0, 2, 1], [-1, 3]])).toEqual({ minX: -1, minY: 0, maxX: 2, maxY: 3 });
  });
});

describe("viewBoxAround", () => {
  it("adds the margin on every side and flips y so that it grows downwards", () => {
    const viewBox = viewBoxAround({ minX: -2, minY: -1, maxX: 2, maxY: 1.5 }, 0.1);
    expect(viewBox.x).toBeCloseTo(-2.4, 12);
    expect(viewBox.y).toBeCloseTo(-1.9, 12);
    expect(viewBox.width).toBeCloseTo(4.8, 12);
    expect(viewBox.height).toBeCloseTo(3.3, 12);
  });
});

describe("fitViewBox", () => {
  const viewBox = { x: -2.4, y: -1.4, width: 4.8, height: 2.8 };

  it("fits the wider side, centres the other one and puts world y up", () => {
    const transform = fitViewBox(viewBox, 480, 480);
    expect(transform.scale).toBeCloseTo(100, 12);
    expect(toScreenX(transform, 0)).toBeCloseTo(240, 12);
    expect(toScreenY(transform, 0)).toBeCloseTo(240, 12);
    // Top-left corner of the box (world y = 1.4) lands on the left edge, 100 px down.
    expect(toScreenX(transform, -2.4)).toBeCloseTo(0, 12);
    expect(toScreenY(transform, 1.4)).toBeCloseTo(100, 12);
    expect(toScreenY(transform, -1.4)).toBeCloseTo(380, 12);
  });

  it("fits the taller side when the area is wide", () => {
    const transform = fitViewBox(viewBox, 480, 100);
    expect(transform.scale).toBeCloseTo(100 / 2.8, 12);
    expect(toScreenX(transform, 0)).toBeCloseTo(240, 12);
    expect(toScreenY(transform, 1.4)).toBeCloseTo(0, 12);
    expect(toScreenY(transform, -1.4)).toBeCloseTo(100, 12);
  });
});
