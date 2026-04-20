import { authConfig } from "@/src/auth.config";
import NextAuth from "next-auth";
import type { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = [
  /^\/signin$/,
  /^\/api\/auth(\/.*)?$/,
  /^\/_next(\/.*)?$/,
  /^\/favicon\.ico$/,
  /^\/icon\.png$/,
  /^\/apple-icon\.png$/,
  /^\/manifest\.(json|webmanifest)$/,
  /^\/icon-\d+\.png$/,
  /^\/sw\.js$/,
  /^\/workbox-(.*)\.(js|js\.map)$/,
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((re) => re.test(pathname));
}

export default auth(function middleware(req: NextAuthRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const session = req.auth;

  // Not authenticated → sign-in page
  if (!session?.user?.id) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated but no business yet → onboarding
  const isOnboarding =
    pathname === "/onboarding" || pathname.startsWith("/api/onboarding");

  if (!session.user.businessId && !isOnboarding) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Authenticated with a business, trying to re-visit onboarding → home
  if (session.user.businessId && isOnboarding) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
