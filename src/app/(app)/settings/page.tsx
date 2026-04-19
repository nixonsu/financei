"use client";

import { showToast } from "@/src/components/Toast";
import { signOut, useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/auth/signin" });
    } catch {
      showToast("Failed to sign out", "error");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Settings</h1>

      {user && (
        <section>
          <p className="text-sm font-bold italic text-gray-600 mb-2">Account</p>
          <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-4 px-4 py-4 border-b-2 border-black">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={`${user.firstName} ${user.lastName}`}
                  width={48}
                  height={48}
                  className="rounded-full border-2 border-black shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-black bg-cyan-200 flex items-center justify-center shrink-0">
                  <span className="text-lg font-black">
                    {(user.firstName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                  </span>
                </div>
              )}

              <div className="min-w-0">
                <p className="font-bold truncate">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.name ?? "—"}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            <div className="px-4 py-4">
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex items-center gap-2 h-12 w-full px-5 border-2 border-black bg-pink-200 hover:bg-pink-300 active:bg-pink-400 cursor-pointer font-semibold text-sm transition-colors hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
              >
                Sign out
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
