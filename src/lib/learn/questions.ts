/** A check question with its fixed correction, which also works without the language model. */
export interface Question {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly string[];
  /** Index of the right option. */
  readonly answer: number;
  readonly explanation: string;
}

export const QUESTIONS = {
  distance: {
    id: "distance",
    prompt: "Si duplicas la distancia entre dos cuerpos, ¿qué le pasa a la fuerza con la que se atraen?",
    options: ["Se reduce a la mitad", "Se reduce a la cuarta parte", "No cambia", "Se duplica"],
    answer: 1,
    explanation:
      "La distancia está al cuadrado en la parte de abajo de la fórmula: con el doble de distancia, esa parte se hace 2² = 4 veces mayor y la fuerza queda dividida entre 4.",
  },
  mass: {
    id: "mass",
    prompt: "Si triplicas la masa de uno de los dos cuerpos, ¿qué le pasa a la fuerza?",
    options: ["Se triplica", "Se multiplica por 9", "Se divide entre 3", "No cambia"],
    answer: 0,
    explanation:
      "Cada masa multiplica a la fuerza una sola vez: con el triple de masa en uno de los cuerpos, la fuerza es el triple.",
  },
  orbit: {
    id: "orbit",
    prompt:
      "Lanzas el planeta de lado justo con la velocidad de la órbita circular. ¿Por qué no acaba cayendo sobre la estrella?",
    options: [
      "Porque a esa distancia la gravedad ya no le afecta",
      "Sí cae hacia ella, pero avanza de lado tan deprisa que su caída se curva alrededor de la estrella",
      "Porque la estrella lo empuja hacia fuera",
      "Porque al ir tan rápido la gravedad se anula",
    ],
    answer: 1,
    explanation:
      "La gravedad tira de él todo el tiempo y le curva el camino. A esa velocidad, la curva que dibuja es justo una circunferencia: está cayendo sin parar, pero nunca se acerca.",
  },
  escape: {
    id: "escape",
    prompt: "¿Qué pasa si lo lanzas a más de 1,41 veces la velocidad de la órbita circular?",
    options: [
      "Da vueltas más pequeñas y más rápidas",
      "Se escapa y no vuelve nunca",
      "Choca contra la estrella",
      "Se queda quieto en el sitio",
    ],
    answer: 1,
    explanation:
      "A partir de √2 ≈ 1,41 veces la velocidad circular el planeta tiene energía de sobra: la gravedad lo va frenando, pero nunca llega a detenerlo ni a hacerlo volver.",
  },
} as const satisfies Record<string, Question>;

export type QuestionId = keyof typeof QUESTIONS;

export type Level = "inicial" | "intermedio" | "avanzado";

/**
 * Level shown by the first answer to each question: every one right after at least
 * three is advanced, at least half right is intermediate, anything else is initial.
 */
export function levelFrom(firstAnswers: Readonly<Partial<Record<QuestionId, boolean>>>): Level {
  const answers = Object.values(firstAnswers);
  const right = answers.filter(Boolean).length;
  if (answers.length >= 3 && right === answers.length) return "avanzado";
  if (answers.length > 0 && right * 2 >= answers.length) return "intermedio";
  return "inicial";
}
