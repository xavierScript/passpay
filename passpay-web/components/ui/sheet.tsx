"use client";

import * as React from "react";
import { createPortal } from "react-dom";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      {/* Backdrop - covers entire screen */}
      <div
        className="fixed inset-0 z-[99998] bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet Panel - slides from left */}
      <div className="fixed top-0 left-0 bottom-0 z-[99999] w-[300px] max-w-[85vw] bg-black border-r border-[#1a1a1a] shadow-2xl flex flex-col">
        {children}
      </div>
    </>,
    document.body
  );
}

interface SheetContentProps {
  children: React.ReactNode;
}

export function SheetContent({ children }: SheetContentProps) {
  return <div className="flex flex-col h-full">{children}</div>;
}

interface SheetHeaderProps {
  children: React.ReactNode;
}

export function SheetHeader({ children }: SheetHeaderProps) {
  return (
    <div className="shrink-0 border-b border-[#1a1a1a] px-5 py-4 bg-black">
      {children}
    </div>
  );
}

interface SheetTitleProps {
  children: React.ReactNode;
}

export function SheetTitle({ children }: SheetTitleProps) {
  return <h2 className="text-lg font-semibold text-white">{children}</h2>;
}
