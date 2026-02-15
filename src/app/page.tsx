"use client";

import { User } from "@/generated/prisma/client";
import { API_ROUTES } from "@/src/constants/api-routes";
import { Balances } from "@/src/features/balances/balances";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<Balances | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch(API_ROUTES.ME);
      const user = await res.json();
      setUser(user);
    }

    async function fetchBalances() {
      const res = await fetch(API_ROUTES.BALANCES);
      const balances = await res.json();
      setBalances(balances);
    }

    fetchUser();
    fetchBalances();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-800">
        {user ? (
          <p className="text-gray-600 dark:text-gray-400">
            Hello, {user.firstName}! Your email is {user.email}.
          </p>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Loading user data...
          </p>
        )}
        {balances ? (
          <div className="mt-4 text-gray-600 dark:text-gray-400">
            <p>Card Balance: ${balances.cardBalance.total}</p>
            <p>Cash Balance: ${balances.cashBalance.total}</p>
            <p>Variance: ${balances.variance}</p>
          </div>
        ) : (
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading balances...
          </p>
        )}
      </div>
    </div>
  );
}
