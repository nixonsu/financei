"use client";

import { Client } from "@/generated/prisma/client";
import IconButton from "@/src/components/IconButton";
import Input from "@/src/components/Input";
import { showToast } from "@/src/components/Toast";
import { API_ROUTES } from "@/src/constants/routes";
import { SyncResult } from "@/src/features/clients/client-service";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useReducer, useState } from "react";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [refreshKey, refresh] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    async function loadClients() {
      const res = await fetch(API_ROUTES.CLIENTS);
      const data: Client[] = await res.json();
      setClients(data);
    }
    loadClients();
  }, [refreshKey]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(API_ROUTES.CLIENTS_SYNC, { method: "POST" });
      const result: SyncResult = await res.json();
      refresh();
      showToast(
        `Synced ${result.total} clients - ${result.created} created, ${result.updated} updated`,
      );
    } catch {
      showToast("Failed to sync clients", "error");
    }
    setSyncing(false);
  };

  const filteredClients = useMemo(() => {
    if (!search.trim()) {
      return clients;
    }
    const terms = search.toLowerCase().split(/\s+/);
    return clients.filter((client) => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      return terms.every((term) => fullName.includes(term));
    });
  }, [clients, search]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) =>
      a.firstName.localeCompare(b.firstName),
    );
  }, [filteredClients]);

  return (
    <div className="px-6 pb-8">
      <div className="mt-4 flex items-stretch gap-2">
        <Input
          value={search}
          onChange={setSearch}
          placeholder="Search by their human label..."
          className="w-full!"
        />
        <IconButton
          onClick={handleSync}
          disabled={syncing}
          className="h-auto! w-auto! px-3"
        >
          <ArrowsClockwiseIcon
            size={20}
            className={syncing ? "animate-spin" : ""}
          />
        </IconButton>
      </div>

      <div className="mt-4 flex flex-col">
        {sortedClients.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Nothing but crickets here...
          </p>
        ) : (
          sortedClients.map((client, i) => {
            const letter = client.firstName.charAt(0).toUpperCase();
            const prevLetter =
              i > 0
                ? sortedClients[i - 1].firstName.charAt(0).toUpperCase()
                : null;
            const showSeparator = letter !== prevLetter;

            return (
              <div key={client.id}>
                {showSeparator && (
                  <div className="mt-4 mb-1">
                    <span className="text-sm font-bold text-gray-500">
                      {letter}
                    </span>
                    <hr className="border-gray-300" />
                  </div>
                )}
                <div className="py-3">
                  <h2 className="text-lg font-semibold">
                    {client.firstName} {client.lastName}
                  </h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {client.phoneNumber && <p>{client.phoneNumber}</p>}
                    {client.email && <p className="truncate">{client.email}</p>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
