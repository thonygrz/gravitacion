import { z } from "zod";
import { formatNumber } from "../format";
import { LAB_LIMITS, LAUNCH_LIMITS, outcomeOfLaunch } from "../learn/lab";
import { levelFrom, type QuestionId } from "../learn/questions";
import { gravitationalForce } from "../physics/gravity";

const within = ({ min, max }: { readonly min: number; readonly max: number }) => z.number().min(min).max(max);

/**
 * What the page showed when the user wrote a message. It travels as that message's
 * metadata, so every later request repeats it unchanged and the history stays append-only.
 */
export const tutorContextSchema = z.strictObject({
  answers: z.strictObject({
    distance: z.boolean().optional(),
    mass: z.boolean().optional(),
    orbit: z.boolean().optional(),
    escape: z.boolean().optional(),
  }),
  lab: z.strictObject({
    mass1: within(LAB_LIMITS.mass),
    mass2: within(LAB_LIMITS.mass),
    distance: within(LAB_LIMITS.distance),
  }),
  launchSpeed: within(LAUNCH_LIMITS),
});

export type TutorContext = z.infer<typeof tutorContextSchema>;

// In the order of the lessons.
const QUESTION_NAMES = [
  ["mass", "masa"],
  ["distance", "distancia"],
  ["orbit", "órbita circular"],
  ["escape", "velocidad de escape"],
] as const satisfies readonly (readonly [QuestionId, string])[];

function describeAnswers(answers: TutorContext["answers"]): string {
  return QUESTION_NAMES.map(([id, name]) => {
    const answer = answers[id];
    return `${name}, ${answer === undefined ? "sin contestar" : answer ? "acertada" : "fallada"}`;
  }).join("; ");
}

function describeLaunch(speed: number): string {
  const start = `${formatNumber(speed * 100, 0)} % de la velocidad circular`;
  const outcome = outcomeOfLaunch(speed);
  switch (outcome.kind) {
    case "collision":
      return `${start}: el planeta choca con la estrella.`;
    case "escape":
      return `${start}: el planeta se escapa.`;
    case "orbit":
      return Math.abs(speed - 1) < 0.025
        ? `${start}: órbita circular de radio 1, con un periodo de ${formatNumber(outcome.period, 1)}.`
        : `${start}: órbita entre ${formatNumber(outcome.closest, 2)} y ${formatNumber(outcome.farthest, 2)} de la estrella, con un periodo de ${formatNumber(outcome.period, 1)}.`;
  }
}

/** The system message the model reads right after the user message it belongs to. */
export function describeContext({ answers, lab, launchSpeed }: TutorContext): string {
  const force = gravitationalForce(lab.mass1, lab.mass2, lab.distance);
  return [
    "Estado de la página cuando el usuario ha escrito el mensaje anterior. Úsalo para adaptar la respuesta; no lo recites.",
    `- Nivel del usuario: ${levelFrom(answers)}.`,
    `- Preguntas de comprobación: ${describeAnswers(answers)}.`,
    `- Laboratorio de fuerza: masas ${formatNumber(lab.mass1, 0)} y ${formatNumber(lab.mass2, 0)}, distancia ${formatNumber(lab.distance, 1)}; fuerza de ${formatNumber(force, 3)} G.`,
    `- Lanzador: ${describeLaunch(launchSpeed)}`,
  ].join("\n");
}
