import { createSale } from "@/src/features/transactions/transaction-service";

export async function POST(request: Request): Promise<Response> {
  try {
    const { cardAmount, cashAmount, date, notes, clientId } =
      await request.json();

    await createSale(1, clientId, cardAmount, cashAmount, date, notes);

    return new Response(JSON.stringify({ message: "Sale created" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create sale";
    console.error("Failed to create sale:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
