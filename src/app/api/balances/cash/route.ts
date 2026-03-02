import { updateCashBalance } from "@/src/features/balances/balance-service";

export async function POST(request: Request): Promise<Response> {
  try {
    const { fives, tens, twenties, fifties, hundreds } = await request.json();

    await updateCashBalance(1, fives, tens, twenties, fifties, hundreds);

    return new Response(JSON.stringify({ message: "Cash balance updated" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update cash balance";
    console.error("Failed to update cash balance:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
