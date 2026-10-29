import type { AnthropicLanguageModelOptions } from "@ai-sdk/anthropic";
import { createUIMessageStreamResponse, streamText, toUIMessageStream, type LanguageModel } from "ai";
import { TUTOR_ERRORS, tutorErrorText } from "./errors";
import { TUTOR_INSTRUCTIONS } from "./instructions";
import { parseTutorRequest, toModelMessages, type TutorMetadata } from "./messages";
import { tutorTools } from "./tools";

// Answers are short by design; this leaves room for them and for the thinking before them.
const MAX_OUTPUT_TOKENS = 2048;

const plainText = (status: number, text: string) =>
  new Response(text, { status, headers: { "content-type": "text/plain; charset=utf-8" } });

/**
 * POST /api/tutor. `model` is null without an API key, and the panel then stays in its
 * reduced mode. Kept apart from the route so the tests can pass a mock model.
 */
export async function handleTutorRequest(request: Request, model: LanguageModel | null): Promise<Response> {
  if (model === null) return plainText(503, TUTOR_ERRORS.unavailable);
  // A JSON body makes browsers ask first before a request from another site, and this
  // route never answers that preflight, so other sites cannot spend the tutor's budget.
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return plainText(415, TUTOR_ERRORS.notJson);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return plainText(400, TUTOR_ERRORS.invalid);
  }
  const parsed = await parseTutorRequest(body);
  if (!parsed.ok) return plainText(parsed.status, parsed.error);

  const result = streamText({
    model,
    instructions: {
      role: "system",
      content: TUTOR_INSTRUCTIONS,
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
    },
    messages: await toModelMessages(parsed.messages),
    // The system messages in there are the server's: parseTutorRequest refuses the browser's.
    allowSystemInMessages: true,
    tools: tutorTools,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    // Low effort is the level meant for chat: less thinking, so the answer starts sooner.
    providerOptions: { anthropic: { effort: "low" } satisfies AnthropicLanguageModelOptions },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: tutorErrorText,
      messageMetadata: ({ part }): TutorMetadata | undefined =>
        part.type === "finish"
          ? {
              usage: {
                inputTokens: part.totalUsage.inputTokens,
                cachedInputTokens: part.totalUsage.inputTokenDetails.cacheReadTokens,
                outputTokens: part.totalUsage.outputTokens,
              },
            }
          : undefined,
    }),
  });
}
