import { anthropic } from "@ai-sdk/anthropic";
import { connection } from "next/server";
import { handleTutorRequest } from "@/lib/tutor/handler";

// An answer takes seconds; this ends a request that hangs instead of leaving it open.
export const maxDuration = 30;

const DEFAULT_MODEL = "claude-haiku-5-5";

// Read on every request from the server's own environment: the key never reaches the build or the browser.
function tutorModel() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return anthropic(process.env.TUTOR_MODEL || DEFAULT_MODEL);
}

/** Whether the tutor can answer, so the panel can say so before anyone writes. */
export async function GET() {
  // Without it the answer would be prerendered with the environment of the build.
  await connection();
  return Response.json({ available: tutorModel() !== null });
}

export async function POST(request: Request) {
  return handleTutorRequest(request, tutorModel());
}
