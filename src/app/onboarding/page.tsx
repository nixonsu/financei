"use client";

import Input from "@/src/components/Input";
import { showToast } from "@/src/components/Toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [firstName, setFirstName] = useState(
    session?.user?.name?.split(" ")[0] ?? "",
  );
  const [lastName, setLastName] = useState(
    session?.user?.name?.split(" ").slice(1).join(" ") ?? "",
  );
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, businessName }),
      });

      const body = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        showToast(body.error ?? "Setup failed", "error");
        return;
      }

      // Refresh the session so businessId is populated in the JWT
      await update();
      router.push("/");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">
            Set up your account
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Just a few details and you&apos;re ready to go.
          </p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="border-2 border-black bg-white shadow-[6px_6px_0px_rgba(0,0,0,1)] p-6"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide">
                First name
              </label>
              <Input
                value={firstName}
                onChange={(v) => setFirstName(v)}
                placeholder="e.g. Alex"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide">
                Last name
              </label>
              <Input
                value={lastName}
                onChange={(v) => setLastName(v)}
                placeholder="e.g. Smith"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide">
                Business name
              </label>
              <Input
                value={businessName}
                onChange={(v) => setBusinessName(v)}
                placeholder="e.g. Blossom Studio"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !firstName || !lastName || !businessName}
              className="mt-2 h-12 px-5 border-2 border-black bg-cyan-200 hover:bg-cyan-300 active:bg-cyan-400 font-semibold text-sm cursor-pointer transition-colors hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-disabled-fg disabled:hover:shadow-none"
            >
              {submitting ? "Setting up…" : "Get started"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
