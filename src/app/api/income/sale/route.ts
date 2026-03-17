import { createSale } from "@/src/features/transactions/transaction-service";
import { parseRequestBody } from "@/src/utils/validation";
import { z } from "zod";

const saleSchema = z
  .object({
    cardAmount: z.number({ error: "Card amount must be a number" }).min(0, "Card amount cannot be negative"),
    cashAmount: z.number({ error: "Cash amount must be a number" }).min(0, "Cash amount cannot be negative"),
    date: z.iso.date({ error: "Please select a date" }),
    notes: z.string(),
    clientId: z.number({ error: "Please select a client" }),
  })
  .refine((data) => data.cardAmount > 0 || data.cashAmount > 0, {
    message: "Please enter a card or cash amount",
  });

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseRequestBody(request, saleSchema);
    if (!parsed.success) return parsed.response;
    const { cardAmount, cashAmount, date, notes, clientId } = parsed.data;

    await createSale(1, clientId, date, notes, cardAmount, cashAmount);

    return new Response(JSON.stringify({ message: "Sale created" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add sale";
    console.error("Failed to add sale:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
