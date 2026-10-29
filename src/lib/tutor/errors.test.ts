import { APICallError, RetryError } from "ai";
import { describe, expect, it } from "vitest";
import { shownError, TUTOR_ERRORS, tutorErrorText } from "./errors";

const apiError = (statusCode: number, message: string) =>
  new APICallError({
    message,
    url: "https://api.anthropic.com/v1/messages",
    requestBodyValues: {},
    statusCode,
    responseBody: JSON.stringify({ type: "error", error: { message } }),
  });

describe("tutorErrorText", () => {
  it("tells a spent budget apart, whichever limit was reached", () => {
    // Both begin the way the rate limits page says they do.
    const workspace = apiError(400, "You have reached your specified workspace API usage limits. You will regain access on 2026-11-01 at 00:00 UTC.");
    const tier = apiError(429, "You have reached your API usage limits: your organization has crossed its monthly API usage threshold.");
    expect(tutorErrorText(workspace)).toBe(TUTOR_ERRORS.budget);
    expect(tutorErrorText(tier)).toBe(TUTOR_ERRORS.budget);
  });

  it("asks to wait on a rate limit, also once the retries are spent", () => {
    const limited = apiError(429, "Number of request tokens has exceeded your per-minute rate limit");
    expect(tutorErrorText(limited)).toBe(TUTOR_ERRORS.busy);
    expect(tutorErrorText(new RetryError({ message: "Failed after 3 attempts", reason: "maxRetriesExceeded", errors: [limited] }))).toBe(
      TUTOR_ERRORS.busy,
    );
  });

  it("names a bad key and keeps everything else generic", () => {
    expect(tutorErrorText(apiError(401, "invalid x-api-key"))).toBe(TUTOR_ERRORS.key);
    expect(tutorErrorText(apiError(500, "Internal server error"))).toBe(TUTOR_ERRORS.failed);
    expect(tutorErrorText(new Error("socket hang up"))).toBe(TUTOR_ERRORS.failed);
  });
});

describe("shownError", () => {
  it("shows the tutor's own messages and nothing else", () => {
    expect(shownError(TUTOR_ERRORS.tooLong)).toBe(TUTOR_ERRORS.tooLong);
    expect(shownError("Failed to fetch")).toBe(TUTOR_ERRORS.failed);
  });
});
