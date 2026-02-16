import { updateCashBalance } from "@/src/features/balances/balance-service";

export async function POST(request: Request): Promise<Response> {
  const { fives, tens, twenties, fifties, hundreds } = await request.json();

  await updateCashBalance(1, fives, tens, twenties, fifties, hundreds);

  return new Response(null, {
    status: 201,
    headers: { "Content-Type": "text/plain" },
  });
}
