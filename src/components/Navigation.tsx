"use client";

import {
  ArrowsCounterClockwiseIcon,
  ChartLineIcon,
  GearIcon,
  HouseIcon,
  ListIcon,
  MinusIcon,
  PlusIcon,
  UserIcon,
  XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

const ICON_SIZE = 28;
const FANOUT_ANIM_MS = 220;
const FAB_SIZE_PX = 56;
const FAB_GAP_PX = 12;
/** Bottom offset of FAB above viewport bottom (nav stack + small gap); matches layout padding. */
const FAB_NAV_OFFSET =
  "calc(6.25rem + env(safe-area-inset-bottom, 0px) + 10px)";

const fanoutActions = [
  {
    key: "income",
    href: "/add-income",
    label: "Add income",
    icon: <PlusIcon weight="bold" size={22} className="text-white" />,
  },
  {
    key: "expense",
    href: "/add-expense",
    label: "Add expense",
    icon: <MinusIcon weight="bold" size={22} className="text-white" />,
  },
  {
    key: "convert",
    href: "/add-convert",
    label: "Convert",
    icon: (
      <ArrowsCounterClockwiseIcon
        weight="bold"
        size={24}
        className="text-white"
      />
    ),
  },
] as const;

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const [fanoutOpen, setFanoutOpen] = useState(false);
  const [fanoutMounted, setFanoutMounted] = useState(false);
  const [fabPortalReady, setFabPortalReady] = useState(false);

  useLayoutEffect(() => {
    // FAB is portaled to document.body; must run only on the client after hydration.
    setFabPortalReady(true); // eslint-disable-line react-hooks/set-state-in-effect -- one-shot mount gate for createPortal
  }, []);

  const closeFanout = useCallback(() => {
    setFanoutOpen(false);
    window.setTimeout(() => setFanoutMounted(false), FANOUT_ANIM_MS);
  }, []);

  useEffect(() => {
    if (!fanoutOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFanout();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fanoutOpen, closeFanout]);

  const openFanout = () => {
    setFanoutMounted(true);
    requestAnimationFrame(() => setFanoutOpen(true));
  };

  const toggleFanout = () => {
    if (fanoutOpen) closeFanout();
    else openFanout();
  };

  const go = (href: string) => {
    closeFanout();
    router.push(href);
  };

  const fabShellClass =
    "flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full border-3 border-black bg-black text-white shadow transition-[transform,opacity,bottom] duration-200 ease-out";

  const stackHeightOpen =
    FAB_SIZE_PX + fanoutActions.length * (FAB_SIZE_PX + FAB_GAP_PX);

  const fabStack = (
    <div
      className="pointer-events-none fixed z-60"
      style={{
        bottom: FAB_NAV_OFFSET,
        right: "max(1rem, env(safe-area-inset-right, 0px))",
        width: FAB_SIZE_PX,
        height: fanoutMounted ? stackHeightOpen : FAB_SIZE_PX,
        transition: `height ${FANOUT_ANIM_MS}ms ease-out`,
      }}
    >
      <div className="relative size-full">
        {fanoutMounted &&
          fanoutActions.map((action, i) => {
            const step = i + 1;
            const openBottom = step * (FAB_SIZE_PX + FAB_GAP_PX);
            const reverseIndex = fanoutActions.length - 1 - i;
            const openDelay = reverseIndex * 40;
            const closeDelay = i * 35;
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => go(action.href)}
                className={`${fabShellClass} pointer-events-auto absolute right-0 ${
                  fanoutOpen
                    ? "translate-y-0 scale-100 opacity-100"
                    : "translate-y-2 scale-75 opacity-0"
                }`}
                style={{
                  bottom: fanoutOpen ? openBottom : 0,
                  transitionDelay: fanoutOpen
                    ? `${openDelay}ms`
                    : `${closeDelay}ms`,
                  zIndex: 5 - i,
                }}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            );
          })}

        <button
          type="button"
          onClick={toggleFanout}
          aria-expanded={fanoutOpen}
          aria-label={fanoutOpen ? "Close add menu" : "Open add menu"}
          className={`${fabShellClass} pointer-events-auto absolute bottom-0 right-0 z-10`}
        >
          {fanoutOpen ? (
            <XIcon weight="bold" size={24} className="text-white" />
          ) : (
            <PlusIcon weight="bold" size={26} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative w-full">
      {fabPortalReady && createPortal(fabStack, document.body)}

      <div className="relative z-10 mx-auto grid w-full max-w-md grid-cols-5 items-end pb-1 pt-2">
        <NavLink
          href="/transactions"
          active={pathname === "/transactions"}
          onNavigate={fanoutOpen ? closeFanout : undefined}
        >
          <ListIcon weight="fill" size={ICON_SIZE} />
        </NavLink>

        <NavLink
          href="/statistics"
          active={pathname === "/statistics"}
          onNavigate={fanoutOpen ? closeFanout : undefined}
        >
          <ChartLineIcon weight="fill" size={ICON_SIZE} />
        </NavLink>

        <NavLink
          href="/"
          active={pathname === "/"}
          onNavigate={fanoutOpen ? closeFanout : undefined}
        >
          <HouseIcon weight="fill" size={ICON_SIZE} />
        </NavLink>

        <NavLink
          href="/clients"
          active={pathname === "/clients"}
          onNavigate={fanoutOpen ? closeFanout : undefined}
        >
          <UserIcon weight="fill" size={ICON_SIZE} />
        </NavLink>

        <NavLink
          href="/settings"
          active={pathname === "/settings"}
          onNavigate={fanoutOpen ? closeFanout : undefined}
        >
          <GearIcon weight="fill" size={ICON_SIZE} />
        </NavLink>
      </div>

      {fanoutMounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-55 bg-black/50 transition-opacity duration-200 ${
              fanoutOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeFanout}
            aria-hidden
          />,
          document.body,
        )}
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
