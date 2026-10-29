import { describe, expect, it } from "vitest";
import { levelFrom, QUESTIONS } from "./questions";

describe("check questions", () => {
  it("point their answer at one of their options and key themselves by id", () => {
    for (const [key, question] of Object.entries(QUESTIONS)) {
      expect(question.id).toBe(key);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(question.options.length);
    }
  });
});

describe("levelFrom", () => {
  it("starts at the initial level", () => {
    expect(levelFrom({})).toBe("inicial");
  });

  it("is intermediate with at least half of the first answers right", () => {
    expect(levelFrom({ distance: true })).toBe("intermedio");
    expect(levelFrom({ distance: true, mass: false })).toBe("intermedio");
    expect(levelFrom({ distance: false, mass: false, orbit: true })).toBe("inicial");
  });

  it("is advanced only with every answer right after three of them", () => {
    expect(levelFrom({ distance: true, mass: true })).toBe("intermedio");
    expect(levelFrom({ distance: true, mass: true, orbit: true })).toBe("avanzado");
    expect(levelFrom({ distance: true, mass: true, orbit: true, escape: false })).toBe("intermedio");
  });
});
