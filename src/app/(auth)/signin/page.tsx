"use client";

import { showToast } from "@/src/components/Toast";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

function GoogleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022" />
      <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00" />
      <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF" />
      <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900" />
    </svg>
  );
}

function ErrorHandler() {
  const searchParams = useSearchParams();
  const toastShown = useRef(false);

  useEffect(() => {
    if (toastShown.current) return;
    const error = searchParams.get("error");
    if (error) {
      toastShown.current = true;
      const messages: Record<string, string> = {
        OAuthAccountNotLinked:
          "This email is already linked to a different sign-in method.",
        OAuthSignin: "Something went wrong with the sign-in. Please try again.",
        OAuthCallback: "Sign-in was cancelled or failed.",
        AccessDenied: "Access denied.",
      };
      showToast(messages[error] ?? "Sign-in failed. Please try again.", "error");
    }
  }, [searchParams]);

  return null;
}

export default function SignInPage() {
  return (
    <div className="w-full max-w-sm">
      <Suspense>
        <ErrorHandler />
      </Suspense>

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-tight">Financé</h1>
        <p className="mt-2 text-sm text-gray-500 font-medium">
          Bookkeeping for the financially disorganised.
        </p>
      </div>

      <div className="border-2 border-black bg-white shadow-[6px_6px_0px_rgba(0,0,0,1)] p-6">
        <p className="text-sm font-bold uppercase tracking-wide mb-5">
          Sign in to continue
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void signIn("google", { callbackUrl: "/" })}
            className="flex items-center gap-3 w-full h-12 px-4 border-2 border-black bg-cyan-200 hover:bg-cyan-300 active:bg-cyan-400 cursor-pointer font-semibold text-sm transition-colors hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            <GoogleIcon size={20} />
            <span>Sign in with Google</span>
          </button>

          <button
            type="button"
            onClick={() => void signIn("microsoft-entra-id", { callbackUrl: "/" })}
            className="flex items-center gap-3 w-full h-12 px-4 border-2 border-black bg-yellow-200 hover:bg-yellow-300 active:bg-yellow-400 cursor-pointer font-semibold text-sm transition-colors hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            <MicrosoftIcon size={20} />
            <span>Sign in with Microsoft</span>
          </button>
        </div>
      </div>
    </div>
  );
}
