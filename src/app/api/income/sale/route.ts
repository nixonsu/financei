import { saleTransactionSchema } from "@/src/features/transactions/transaction-schemas";
import { createSale } from "@/src/features/transactions/transaction-service";
import { errorResponse, requireBusinessId } from "@/src/features/auth/session";
import { parseRequestBody } from "@/src/utils/validation";

export async function POST(request: Request): Promise<Response> {
  try {
    const businessId = await requireBusinessId();
    const parsed = await parseRequestBody(request, saleTransactionSchema);
    if (!parsed.success) return parsed.response;
    const { cardAmount, cashAmount, date, notes, clientId } = parsed.data;

    await createSale(businessId, clientId, date, notes, cardAmount, cashAmount);

    return new Response(JSON.stringify({ message: "Sale added" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to add sale:", error);
    return errorResponse(error);
  }
}
