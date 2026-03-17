import { baseTransactionSchema } from "@/src/features/transactions/transaction-schemas";
import { createBusinessExpense } from "@/src/features/transactions/transaction-service";
import { parseRequestBody } from "@/src/utils/validation";

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseRequestBody(request, baseTransactionSchema);
    if (!parsed.success) return parsed.response;
    const { cardAmount, cashAmount, date, notes } = parsed.data;

    await createBusinessExpense(1, date, notes, cardAmount, cashAmount);

    return new Response(JSON.stringify({ message: "Business expense added" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to add business expense";
    console.error("Failed to add business expense:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
