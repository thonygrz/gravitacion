import { describe, expect, it } from "vitest";
import { LAB_START } from "../learn/lab";
import { QUESTIONS } from "../learn/questions";
import { describeContext, tutorContextSchema, type TutorContext } from "./context";

const START: TutorContext = { answers: {}, lab: LAB_START, launchSpeed: 1 };

describe("tutorContextSchema", () => {
  it("knows every check question", () => {
    expect(Object.keys(tutorContextSchema.shape.answers.shape).sort()).toEqual(Object.keys(QUESTIONS).sort());
  });

  it("accepts the page as the sliders can leave it", () => {
    expect(tutorContextSchema.safeParse(START).success).toBe(true);
  });

  it("refuses values the sliders cannot reach and keys it does not know", () => {
    expect(tutorContextSchema.safeParse({ ...START, lab: { ...LAB_START, mass1: 11 } }).success).toBe(false);
    expect(tutorContextSchema.safeParse({ ...START, launchSpeed: 2 }).success).toBe(false);
    expect(tutorContextSchema.safeParse({ ...START, answers: { gravity: true } }).success).toBe(false);
  });
});

describe("describeContext", () => {
  it("gives the level from the first answers and says which ones were right", () => {
    const text = describeContext({ ...START, answers: { mass: true, distance: false } });
    expect(text).toContain("- Nivel del usuario: intermedio.");
    expect(text).toContain(
      "- Preguntas de comprobación: masa, acertada; distancia, fallada; órbita circular, sin contestar; velocidad de escape, sin contestar.",
    );
  });

  it("gives the lab values with the force they make", () => {
    expect(describeContext({ ...START, lab: { mass1: 4, mass2: 8, distance: 2 } })).toContain(
      "- Laboratorio de fuerza: masas 4 y 8, distancia 2; fuerza de 8 G.",
    );
  });

  it("says what the launch speed does", () => {
    expect(describeContext(START)).toContain("100 % de la velocidad circular: órbita circular de radio 1, con un periodo de 6,3.");
    expect(describeContext({ ...START, launchSpeed: 0.3 })).toContain("30 % de la velocidad circular: el planeta choca con la estrella.");
    expect(describeContext({ ...START, launchSpeed: 1.5 })).toContain("150 % de la velocidad circular: el planeta se escapa.");
    expect(describeContext({ ...START, launchSpeed: 0.8 })).toContain("80 % de la velocidad circular: órbita entre 0,47 y 1 de la estrella");
  });
});
