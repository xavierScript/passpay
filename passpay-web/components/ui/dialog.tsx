"use client";
import React from "react";
import { cn } from "./utils";

export function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-4"
        )}
      >
        {children}
      </div>
    </div>
  );
}
