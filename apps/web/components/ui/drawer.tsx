"use client";

import { cn } from "@/lib/cn";
import { CloseIcon } from "@/components/ui/modal";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** "right" = side panel (tutor drawer); "bottom" = mobile bottom sheet. */
  side?: "right" | "bottom";
  children: ReactNode;
  className?: string;
}

/**
 * Edge-anchored panel on native <dialog>. The right variant is the tutor/
 * compare panel; the bottom variant is the mobile controls sheet
 * (docs/04-wireframes.md responsive rules).
 */
export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  className,
}: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className={cn(
        "glass fixed p-0 shadow-2xl",
        side === "right"
          ? "bs-drawer-right mr-0 ml-auto my-0 h-dvh max-h-dvh w-[min(92vw,400px)] rounded-none rounded-l-panel"
          : "bs-drawer-bottom mb-0 mt-auto mx-auto w-full max-w-2xl max-h-[85dvh] rounded-none rounded-t-panel",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-full p-1.5 text-ink-3 hover:bg-ink-1/5 hover:text-ink-1"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </dialog>
  );
}
