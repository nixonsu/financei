import { baseTransactionSchema } from "@/src/features/transactions/transaction-schemas";
import { createBusinessExpense } from "@/src/features/transactions/transaction-service";
import { errorResponse, requireBusinessId } from "@/src/features/auth/session";
import { parseRequestBody } from "@/src/utils/validation";

export async function POST(request: Request): Promise<Response> {
  try {
    const businessId = await requireBusinessId();
    const parsed = await parseRequestBody(request, baseTransactionSchema);
    if (!parsed.success) return parsed.response;
    const { cardAmount, cashAmount, date, notes } = parsed.data;

    await createBusinessExpense(businessId, date, notes, cardAmount, cashAmount);

    return new Response(JSON.stringify({ message: "Business expense added" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to add business expense:", error);
    return errorResponse(error);
  }
}
