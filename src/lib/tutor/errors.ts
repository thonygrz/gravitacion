import { APICallError, RetryError } from "ai";

/** Every message the tutor can show for a failure; the server sends them and the panel shows them as they are. */
export const TUTOR_ERRORS = {
  unavailable:
    "El tutor no está disponible ahora mismo: falta la clave del modelo. Las preguntas de comprobación siguen corrigiéndose con su explicación.",
  notJson: "La petición al tutor tiene que ir en JSON.",
  invalid: "El tutor no ha podido leer la conversación. Empieza una nueva.",
  tooLong: "La conversación es demasiado larga. Empieza una nueva para seguir preguntando.",
  tooManySteps: "El tutor ha encadenado demasiados cambios seguidos. Escríbele de nuevo.",
  busy: "Ahora mismo el tutor recibe demasiadas preguntas. Prueba de nuevo en un minuto.",
  budget:
    "El tutor ha gastado el presupuesto de este mes. Las preguntas de comprobación siguen corrigiéndose con su explicación.",
  key: "La clave del modelo no es válida, así que el tutor no puede responder.",
  failed: "El tutor no ha podido responder. Prueba de nuevo.",
} as const;

const TEXTS: readonly string[] = Object.values(TUTOR_ERRORS);

/** Anything else, such as a browser's "Failed to fetch", is shown as the generic failure. */
export const shownError = (message: string): string => (TEXTS.includes(message) ? message : TUTOR_ERRORS.failed);

/** The message for an error from the model provider, which reaches the panel through the stream. */
export function tutorErrorText(error: unknown): string {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  if (!APICallError.isInstance(cause)) return TUTOR_ERRORS.failed;
  // A spend limit answers 400 (one set in the Console) or 429 (the tier's cap), and both
  // messages speak of "usage limits": platform.claude.com/docs/en/api/rate-limits.
  if (cause.responseBody?.includes("usage limits")) return TUTOR_ERRORS.budget;
  if (cause.statusCode === 429) return TUTOR_ERRORS.busy;
  if (cause.statusCode === 401 || cause.statusCode === 403) return TUTOR_ERRORS.key;
  return TUTOR_ERRORS.failed;
}
