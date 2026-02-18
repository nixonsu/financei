"use client";

import { API_ROUTES } from "@/src/constants/routes";
import { Balances } from "@/src/features/balances/balances";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CardBalancePage() {
  const [balances, setBalances] = useState<Balances | null>(null);

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

    const { fives, tens, twenties, fifties, hundreds } =
      balances?.cashBalance || {};

    await fetch(API_ROUTES.BALANCES_CASH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fives, tens, twenties, fifties, hundreds }),
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
            <form onSubmit={handleSubmit} className="mt-4">
              <input
                type="number"
                name="fives"
                placeholder="New Fives Count"
                className="mt-2 rounded border px-4 py-2"
                value={balances.cashBalance.fives}
                onChange={(e) =>
                  setBalances((prev) =>
                    prev
                      ? {
                          ...prev,
                          cashBalance: {
                            ...prev.cashBalance,
                            fives: parseInt(e.target.value),
                          },
                        }
                      : null,
                  )
                }
              />
              <input
                type="number"
                name="tens"
                placeholder="New Tens Count"
                className="mt-2 rounded border px-4 py-2"
                value={balances.cashBalance.tens}
                onChange={(e) =>
                  setBalances((prev) =>
                    prev
                      ? {
                          ...prev,
                          cashBalance: {
                            ...prev.cashBalance,
                            tens: parseInt(e.target.value),
                          },
                        }
                      : null,
                  )
                }
              />
              <input
                type="number"
                name="twenties"
                placeholder="New Twenties Count"
                className="mt-2 rounded border px-4 py-2"
                value={balances.cashBalance.twenties}
                onChange={(e) =>
                  setBalances((prev) =>
                    prev
                      ? {
                          ...prev,
                          cashBalance: {
                            ...prev.cashBalance,
                            twenties: parseInt(e.target.value),
                          },
                        }
                      : null,
                  )
                }
              />
              <input
                type="number"
                name="fifties"
                placeholder="New Fifties Count"
                className="mt-2 rounded border px-4 py-2"
                value={balances.cashBalance.fifties}
                onChange={(e) =>
                  setBalances((prev) =>
                    prev
                      ? {
                          ...prev,
                          cashBalance: {
                            ...prev.cashBalance,
                            fifties: parseInt(e.target.value),
                          },
                        }
                      : null,
                  )
                }
              />
              <input
                type="number"
                name="hundreds"
                placeholder="New Hundreds Count"
                className="mt-2 rounded border px-4 py-2"
                value={balances.cashBalance.hundreds}
                onChange={(e) =>
                  setBalances((prev) =>
                    prev
                      ? {
                          ...prev,
                          cashBalance: {
                            ...prev.cashBalance,
                            hundreds: parseInt(e.target.value),
                          },
                        }
                      : null,
                  )
                }
              />
              <button
                type="submit"
                className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Update Cash Balance
              </button>
            </form>

            <p className="text-gray-600 dark:text-gray-400">
              Current Cash Balance: ${balances.cashBalance.total}
            </p>

            <form onSubmit={handleSubmit} className="mt-4"></form>
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
