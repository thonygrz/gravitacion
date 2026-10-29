import {
  convertToModelMessages,
  isToolUIPart,
  safeValidateUIMessages,
  type InferUITools,
  type ModelMessage,
  type UIDataTypes,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { describeContext, tutorContextSchema } from "./context";
import { TUTOR_ERRORS } from "./errors";
import { tutorTools } from "./tools";

/**
 * Message metadata: user messages carry the page state they were written in, and the
 * server adds the tokens each answer used, to measure the cost of the tutor. Optional as a
 * whole: validateUIMessages checks it on every message, also on those without any.
 */
export const tutorMetadataSchema = z
  .strictObject({
    context: tutorContextSchema.optional(),
    usage: z
      .strictObject({
        inputTokens: z.number().optional(),
        cachedInputTokens: z.number().optional(),
        outputTokens: z.number().optional(),
      })
      .optional(),
  })
  .optional();

export type TutorMetadata = z.infer<typeof tutorMetadataSchema>;
export type TutorUIMessage = UIMessage<TutorMetadata, UIDataTypes, InferUITools<typeof tutorTools>>;

// Bounds on what a request can make the model read; the panel stays well inside them.
export const LIMITS = {
  messages: 40,
  userText: 600,
  text: 4000,
  // Tool calls the tutor can chain before it waits for the user again.
  toolCalls: 4,
} as const;

export function toolCallsSinceLastUser(messages: readonly TutorUIMessage[]): number {
  let calls = 0;
  for (let i = messages.length - 1; i >= 0 && messages[i].role !== "user"; i--) {
    calls += messages[i].parts.filter(isToolUIPart).length;
  }
  return calls;
}

const bodySchema = z.object({ messages: z.array(z.unknown()).min(1) });

export type ParsedTutorRequest =
  | { readonly ok: true; readonly messages: TutorUIMessage[] }
  | { readonly ok: false; readonly status: number; readonly error: string };

const refuse = (status: number, error: string): ParsedTutorRequest => ({ ok: false, status, error });

/** Validates a request body from the panel: everything in it comes from the browser. */
export async function parseTutorRequest(body: unknown): Promise<ParsedTutorRequest> {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return refuse(400, TUTOR_ERRORS.invalid);
  if (parsed.data.messages.length > LIMITS.messages) return refuse(413, TUTOR_ERRORS.tooLong);

  const validated = await safeValidateUIMessages<TutorUIMessage>({
    messages: parsed.data.messages,
    metadataSchema: tutorMetadataSchema,
    tools: tutorTools,
  });
  if (!validated.success) return refuse(400, TUTOR_ERRORS.invalid);
  const messages = validated.data;

  // Only the server writes system messages; one from the browser could rewrite the rules.
  if (messages[0].role !== "user" || messages.some((message) => message.role === "system")) {
    return refuse(400, TUTOR_ERRORS.invalid);
  }
  const tooLong = messages.some((message) =>
    message.parts.some(
      (part) => part.type === "text" && part.text.length > (message.role === "user" ? LIMITS.userText : LIMITS.text),
    ),
  );
  if (tooLong) return refuse(413, TUTOR_ERRORS.tooLong);
  if (toolCallsSinceLastUser(messages) > LIMITS.toolCalls) return refuse(400, TUTOR_ERRORS.tooManySteps);

  return { ok: true, messages };
}

/**
 * The conversation for the model: each user message is followed by a system message with
 * the page state it was written in. Built only from the messages themselves, so a request
 * repeats every earlier message exactly as the previous one sent it.
 */
export async function toModelMessages(messages: readonly TutorUIMessage[]): Promise<ModelMessage[]> {
  const result: ModelMessage[] = [];
  for (const message of messages) {
    result.push(...(await convertToModelMessages([message], { tools: tutorTools })));
    const context = message.role === "user" ? message.metadata?.context : undefined;
    if (context) result.push({ role: "system", content: describeContext(context) });
  }
  return result;
}
