import { authConfig } from "@/src/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import { prisma } from "@/src/lib/prisma";

function splitName(name?: string | null): { firstName: string; lastName: string } {
  const parts = (name ?? "").trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

function makePrismaAdapter() {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    createUser: ({ name, ...data }: Parameters<NonNullable<typeof base.createUser>>[0]) =>
      base.createUser!({ ...data, ...splitName(name) }),
    updateUser: ({ name, ...data }: Parameters<NonNullable<typeof base.updateUser>>[0]) =>
      base.updateUser!({ ...data, ...(name !== undefined ? splitName(name) : {}) } as never),
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: makePrismaAdapter(),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // On initial sign-in, `user` is populated by the adapter
      if (user?.id) {
        token.userId = Number(user.id);
      }

      if (token.userId) {
        const userId = token.userId as number;

        // Always stamp firstName/lastName from DB in case onboarding just completed
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        });
        if (dbUser) {
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
        }

        // Re-check businessId on explicit update() call or if not yet set
        if (!token.businessId || trigger === "update") {
          const business = await prisma.business.findFirst({
            where: { userId },
            select: { id: true },
          });
          token.businessId = business?.id ?? null;
        }
      }

      return token;
    },
  },
});
