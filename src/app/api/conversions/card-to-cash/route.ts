import { conversionSchema } from "@/src/features/transactions/transaction-schemas";
import { createCardToCashConversion } from "@/src/features/transactions/transaction-service";
import { errorResponse, requireBusinessId } from "@/src/features/auth/session";
import { parseRequestBody } from "@/src/utils/validation";

export async function POST(request: Request): Promise<Response> {
  try {
    const businessId = await requireBusinessId();
    const parsed = await parseRequestBody(request, conversionSchema);
    if (!parsed.success) return parsed.response;
    const { amount, date, notes } = parsed.data;

    await createCardToCashConversion(businessId, date, notes, amount);

    return new Response(
      JSON.stringify({ message: "Card to cash conversion added" }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Failed to add card-to-cash conversion:", error);
    return errorResponse(error);
  }
}
