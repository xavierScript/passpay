import React from "react";
import { cn } from "./utils";
export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-200",
        className
      )}
    >
      {children}
    </span>
  );
}
