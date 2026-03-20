import { PrismaClient, User } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
