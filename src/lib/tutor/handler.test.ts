import { APICallError } from "ai";
import { convertArrayToReadableStream, MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { LAB_START } from "../learn/lab";
import { describeContext, type TutorContext } from "./context";
import { TUTOR_ERRORS } from "./errors";
import { handleTutorRequest } from "./handler";
import { TUTOR_INSTRUCTIONS } from "./instructions";
import type { TutorUIMessage } from "./messages";

const CONTEXT: TutorContext = { answers: { mass: true }, lab: LAB_START, launchSpeed: 1 };

const user = (id: string, text: string, context: TutorContext = CONTEXT): TutorUIMessage => ({
  id,
  role: "user",
  metadata: { context },
  parts: [{ type: "text", text }],
});

const post = (body: unknown, contentType = "application/json") =>
  new Request("http://localhost/api/tutor", {
    method: "POST",
    headers: { "content-type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

// What a mock model streams, taken from its own constructor so the chunks keep their literal types.
type StreamResult = Extract<NonNullable<ConstructorParameters<typeof MockLanguageModelV4>[0]>["doStream"], { stream: unknown }>;

const usage = {
  inputTokens: { total: 120, noCache: 20, cacheRead: 100, cacheWrite: undefined },
  outputTokens: { total: 30, text: 30, reasoning: undefined },
};

const answering = (text: string): StreamResult => ({
  stream: convertArrayToReadableStream([
    { type: "text-start", id: "t1" },
    { type: "text-delta", id: "t1", delta: text },
    { type: "text-end", id: "t1" },
    { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage },
  ]),
});

const callingSetLab = (): StreamResult => ({
  stream: convertArrayToReadableStream([
    { type: "tool-call", toolCallId: "c1", toolName: "setLab", input: '{"distance":8}' },
    { type: "finish", finishReason: { unified: "tool-calls", raw: undefined }, usage },
  ]),
});

/** The UI message stream as a list of its JSON chunks. */
async function chunksOf(response: Response): Promise<unknown[]> {
  const text = await response.text();
  return text
    .split("\n")
    .filter((line) => line.startsWith("data: ") && line !== "data: [DONE]")
    .map((line): unknown => JSON.parse(line.slice("data: ".length)));
}

describe("handleTutorRequest", () => {
  it("answers 503 without a model, so the panel stays in its reduced mode", async () => {
    const response = await handleTutorRequest(post({ messages: [user("u1", "Hola")] }), null);
    expect(response.status).toBe(503);
    expect(await response.text()).toBe(TUTOR_ERRORS.unavailable);
  });

  it("refuses bodies that are not JSON or not a conversation", async () => {
    const model = new MockLanguageModelV4({ doStream: answering("Hola") });
    expect((await handleTutorRequest(post({ messages: [user("u1", "Hola")] }, "text/plain"), model)).status).toBe(415);
    expect((await handleTutorRequest(post("{not json"), model)).status).toBe(400);
    expect((await handleTutorRequest(post({ messages: [] }), model)).status).toBe(400);
    expect(model.doStreamCalls).toHaveLength(0);
  });

  it("streams the answer with the tokens it used", async () => {
    const model = new MockLanguageModelV4({ doStream: answering("La gravedad atrae.") });
    const response = await handleTutorRequest(post({ messages: [user("u1", "¿Qué es la gravedad?")] }), model);
    expect(response.headers.get("x-vercel-ai-ui-message-stream")).toBe("v1");
    const chunks = await chunksOf(response);
    expect(chunks).toContainEqual({ type: "text-delta", id: "t1", delta: "La gravedad atrae." });
    expect(chunks).toContainEqual(
      expect.objectContaining({ messageMetadata: { usage: { inputTokens: 120, cachedInputTokens: 100, outputTokens: 30 } } }),
    );
  });

  it("sends the fixed instructions, the page state after the user message and the tools", async () => {
    const model = new MockLanguageModelV4({ doStream: answering("Hola") });
    await chunksOf(await handleTutorRequest(post({ messages: [user("u1", "Hola")] }), model));
    const [call] = model.doStreamCalls;
    expect(call.prompt[0]).toEqual({
      role: "system",
      content: TUTOR_INSTRUCTIONS,
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
    });
    expect(call.prompt.slice(1).map(({ role }) => role)).toEqual(["user", "system"]);
    expect(call.prompt[2]).toMatchObject({ role: "system", content: describeContext(CONTEXT) });
    expect(call.tools?.map((tool) => tool.name)).toEqual(["setLab", "setLaunchSpeed", "showOrbit"]);
    expect(call.providerOptions).toEqual({ anthropic: { effort: "low" } });
    expect(call.maxOutputTokens).toBe(2048);
  });

  it("repeats every earlier message exactly, so the history stays append-only", async () => {
    const model = new MockLanguageModelV4({ doStream: [answering("Primera respuesta."), answering("Segunda respuesta.")] });
    const first = [user("u1", "Hola")];
    await chunksOf(await handleTutorRequest(post({ messages: first }), model));
    const answer: TutorUIMessage = { id: "a1", role: "assistant", parts: [{ type: "step-start" }, { type: "text", text: "Primera respuesta." }] };
    // The page changed in between: the first message must still carry the state it was written in.
    const later = user("u2", "¿Y la Luna?", { ...CONTEXT, lab: { ...LAB_START, distance: 8 } });
    await chunksOf(await handleTutorRequest(post({ messages: [...first, answer, later] }), model));

    const [one, two] = model.doStreamCalls;
    expect(two.prompt.slice(0, one.prompt.length)).toEqual(one.prompt);
    expect(two.tools).toEqual(one.tools);
  });

  it("passes tool calls on to the browser, which runs them", async () => {
    const model = new MockLanguageModelV4({ doStream: callingSetLab() });
    const chunks = await chunksOf(await handleTutorRequest(post({ messages: [user("u1", "Duplica la distancia")] }), model));
    expect(chunks).toContainEqual(expect.objectContaining({ type: "tool-input-available", toolName: "setLab", input: { distance: 8 } }));
    expect(chunks).not.toContainEqual(expect.objectContaining({ type: "tool-output-available" }));
  });

  it("turns a provider error into the tutor's own message", async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw new APICallError({
          message: "You have reached your specified workspace API usage limits.",
          url: "https://api.anthropic.com/v1/messages",
          requestBodyValues: {},
          statusCode: 400,
          responseBody: '{"type":"error","error":{"type":"invalid_request_error","message":"You have reached your specified workspace API usage limits."}}',
          isRetryable: false,
        });
      },
    });
    const chunks = await chunksOf(await handleTutorRequest(post({ messages: [user("u1", "Hola")] }), model));
    expect(chunks).toContainEqual({ type: "error", errorText: TUTOR_ERRORS.budget });
  });
});
