import type { NextAuthConfig, Session } from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      firstName: string;
      lastName: string;
      businessId: number | null;
    };
  }
}

/**
 * Edge-safe auth config — no Prisma, no Node.js-only modules.
 * Used by middleware. The full auth.ts adds PrismaAdapter and DB callbacks.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/common/v2.0`,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    /**
     * Expose custom JWT claims onto the session object.
     * This runs in the Edge runtime so must not access the database.
     */
    session({ session, token }): Session {
      return {
        ...session,
        user: {
          ...session.user,
          id: String(token.userId ?? ""),
          firstName: (token.firstName as string) ?? "",
          lastName: (token.lastName as string) ?? "",
          businessId: (token.businessId as number | null) ?? null,
        },
      };
    },
  },
};
