"use client";

import classNames from "classnames";
import { useLayoutEffect, useRef, type ReactNode } from "react";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  pendingConfirmLabel?: string;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  isPending?: boolean;
};

/**
 * Modal confirmation using the native dialog element.
 * Avoid unconditional `flex` on the dialog: it overrides the user-agent `display: none` when closed.
 */
export default function Dialog({
  open,
  onOpenChange,
  title,
  cancelLabel = "Cancel",
  confirmLabel,
  pendingConfirmLabel = "Closing…",
  onConfirm,
  confirmDisabled = false,
  isPending = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  const dismiss = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  return (
    <dialog
      ref={dialogRef}
      className={classNames(
        "fixed inset-0 z-50 m-0 h-screen w-screen max-h-none max-w-none border-none bg-transparent p-0",
        open ? "flex items-center justify-center" : "hidden",
      )}
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="w-96 max-w-[calc(100vw-2rem)] px-8 py-4 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] grid place-content-center">
        <div>
          <h2 className="text-2xl mb-4 font-bold leading-snug">{title}</h2>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              type="button"
              className="text-base cursor-pointer hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={dismiss}
              disabled={isPending}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={confirmDisabled || isPending}
              className="h-12 border-black border-2 px-4 bg-[#A6FAFF] hover:bg-[#79F7FF] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:bg-[#00E1EF] rounded-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
              onClick={onConfirm}
            >
              {isPending ? pendingConfirmLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
