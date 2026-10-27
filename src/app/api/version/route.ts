// Deployment marker: reports the commit this build was made from, so a deploy
// can be verified by what is actually served. Vercel sets VERCEL_GIT_COMMIT_SHA
// during the build; elsewhere it is unset and the marker reports null.
export function GET() {
  return Response.json({ sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null });
}
