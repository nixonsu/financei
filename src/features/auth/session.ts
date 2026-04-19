import { auth } from "@/src/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class OnboardingRequiredError extends Error {
  constructor() {
    super("Onboarding required");
    this.name = "OnboardingRequiredError";
  }
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session;
}

export async function requireUserId(): Promise<number> {
  const session = await requireSession();
  return Number(session.user.id);
}

export async function requireBusinessId(): Promise<number> {
  const session = await requireSession();
  if (!session.user.businessId) throw new OnboardingRequiredError();
  return session.user.businessId;
}

/** Returns a 401 or 303 Response for use in API route catch blocks. */
export function errorResponse(err: unknown): Response {
  if (err instanceof UnauthorizedError) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (err instanceof OnboardingRequiredError) {
    return new Response(JSON.stringify({ error: "Onboarding required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(
    JSON.stringify({
      error: err instanceof Error ? err.message : "Internal server error",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}
