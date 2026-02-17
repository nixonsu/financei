"use client";

import Input from "@/src/components/Input";
import { API_ROUTES } from "@/src/constants/api-routes";
import { Balances } from "@/src/features/balances/balances";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CardBalancePage() {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [cardBalanceInput, setCardBalanceInput] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBalances() {
      const res = await fetch(API_ROUTES.BALANCES);
      const balances = await res.json();
      setBalances(balances);
    }

    fetchBalances();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await fetch(API_ROUTES.BALANCES_CARD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total: cardBalanceInput }),
    });

    const res = await fetch(API_ROUTES.BALANCES);
    const updatedBalances = await res.json();
    setBalances(updatedBalances);
  };

  return (
    <div>
      <div className="absolute top-4 left-4">
        <Link href="/">Back</Link>
      </div>
      <div>
        {balances ? (
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              Current Card Balance: ${balances.cardBalance.total}
            </p>
            <form onSubmit={handleSubmit} className="mt-4">
              <Input
                value={cardBalanceInput?.toString() || ""}
                type="number"
                placeholder="Ooo update me"
                onChange={(value) =>
                  setCardBalanceInput(parseFloat(value) || 0)
                }
              />
              <button
                type="submit"
                className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Update Card Balance
              </button>
            </form>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Loading balances...
          </p>
        )}
      </div>
    </div>
  );
}
