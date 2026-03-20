import { getUserById } from "@/src/features/users/user-service";

export async function GET(): Promise<Response> {
  const user = await getUserById(1);

  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
