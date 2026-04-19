import { requireUserId } from "@/src/features/auth/session";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";

const onboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  businessName: z.string().min(1, "Business name is required").max(200),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const userId = await requireUserId();

    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues[0]?.message ?? "Invalid input" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { firstName, lastName, businessName } = parsed.data;

    // Check they don't already have a business (idempotency guard)
    const existingBusiness = await prisma.business.findFirst({
      where: { userId },
    });
    if (existingBusiness) {
      return new Response(
        JSON.stringify({ error: "Business already set up" }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { firstName, lastName },
      }),
      prisma.business.create({
        data: { userId, name: businessName },
      }),
    ]);

    return new Response(
      JSON.stringify({ message: "Onboarding complete" }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Onboarding failed:", error);
    return new Response(
      JSON.stringify({ error: "Onboarding failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
