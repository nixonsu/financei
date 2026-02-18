"use client";

import { User } from "@/generated/prisma/client";
import { API_ROUTES } from "@/src/constants/routes";
import { Balances } from "@/src/features/balances/balances";
import Link from "next/link";
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
    <div>
      <div>
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
          <div>
            <div className="mt-4 text-gray-600 dark:text-gray-400">
              <p>Card Balance: ${balances.cardBalance.total}</p>
              <Link href="/card">Update Card Balance</Link>
            </div>
            <div className="mt-4 text-gray-600 dark:text-gray-400">
              <p>Cash Balance: ${balances.cashBalance.total}</p>
              <Link href="/cash">Update Cash Balance</Link>
            </div>
            <div className="mt-4 text-gray-600 dark:text-gray-400">
              <p>Variance: ${balances.variance}</p>
            </div>
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
