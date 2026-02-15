import { getUser } from "@/src/features/users/user-service";

export async function GET(): Promise<Response> {
  const user = await getUser("meep@hotmail.com");

  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
