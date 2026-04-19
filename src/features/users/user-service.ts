import { User } from "@/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";

export async function getUserByEmail(email: string): Promise<User> {
  const user: User = await prisma.user.findUniqueOrThrow({
    where: {
      email: email,
    },
  });

  return user;
}

export async function getUserById(id: number): Promise<User> {
  return await prisma.user.findUniqueOrThrow({ where: { id } });
}
