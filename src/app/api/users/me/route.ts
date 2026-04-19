import { errorResponse, requireSession } from "@/src/features/auth/session";

export async function GET(): Promise<Response> {
  try {
    const session = await requireSession();
    const { id, firstName, lastName, email, image, businessId } = session.user;
    return new Response(
      JSON.stringify({ id, firstName, lastName, email, image, businessId }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
