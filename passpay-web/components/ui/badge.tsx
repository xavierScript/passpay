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
        "inline-flex items-center rounded-full bg-[#1a1a1a] px-2.5 py-1 text-xs font-medium text-white",
        className
      )}
    >
      {children}
    </span>
  );
}
