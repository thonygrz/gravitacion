import { describe, expect, it } from "vitest";
import { formatNumber } from "./format";

describe("formatNumber", () => {
  it("uses a decimal comma and rounds to the requested decimals", () => {
    expect(formatNumber(6.325897, 2)).toBe("6,33");
    expect(formatNumber(17.329052, 3)).toBe("17,329");
  });

  it("keeps every published digit when asked to", () => {
    expect(formatNumber(0.30689, 16)).toBe("0,30689");
    expect(formatNumber(-0.6942256271344834, 16)).toBe("-0,6942256271344834");
  });

  it("pads to a fixed number of decimals when asked to", () => {
    expect(formatNumber(5, 2, 2)).toBe("5,00");
    expect(formatNumber(4.8, 2, 2)).toBe("4,80");
    expect(formatNumber(4.84, 2, 2)).toBe("4,84");
  });

  it("prints floating-point leftovers and negative zero as 0", () => {
    expect(formatNumber(Math.cos(Math.PI / 2), 16)).toBe("0");
    expect(formatNumber(-0, 4)).toBe("0");
  });
});
