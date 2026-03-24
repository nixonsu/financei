"use client";

import {
  ChartLineIcon,
  GearIcon,
  HouseIcon,
  ListIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { UI_ROUTES } from "@/src/constants/routes";
import AddTransactionFab, {
  type AddTransactionFabHandle,
} from "@/src/components/AddTransactionFab";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

const ICON_SIZE = 28;

export default function Navigation() {
  const pathname = usePathname();
  const fabRef = useRef<AddTransactionFabHandle>(null);

  const closeFabMenu = () => {
    fabRef.current?.closeMenu();
  };

  return (
    <div className="relative w-full">
      <AddTransactionFab ref={fabRef} />

      <div className="relative z-10 mx-auto grid w-full max-w-md grid-cols-5 items-end pb-1 pt-2">
        <NavLink
          href="/transactions"
          active={pathname === "/transactions"}
          onNavigate={closeFabMenu}
        >
          <ListIcon weight="fill" size={ICON_SIZE} />
        </NavLink>

        <NavLink
          href={UI_ROUTES.STATISTICS}
          active={pathname === UI_ROUTES.STATISTICS}
          onNavigate={closeFabMenu}
        >
          <ChartLineIcon weight="fill" size={ICON_SIZE} />
        </NavLink>

        <NavLink href="/" active={pathname === "/"} onNavigate={closeFabMenu}>
          <HouseIcon weight="fill" size={ICON_SIZE} />
        </NavLink>

        <NavLink
          href="/clients"
          active={pathname === "/clients"}
          onNavigate={closeFabMenu}
        >
          <UserIcon weight="fill" size={ICON_SIZE} />
        </NavLink>

        <NavLink
          href="/settings"
          active={pathname === "/settings"}
          onNavigate={closeFabMenu}
        >
          <GearIcon weight="fill" size={ICON_SIZE} />
        </NavLink>
      </div>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
  onNavigate,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      className={`flex h-14 flex-col items-center justify-center transition active:scale-95 ${
        active ? "opacity-100" : "opacity-45"
      }`}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
}
