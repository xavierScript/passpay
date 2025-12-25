import React from "react";
import { cn } from "./utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-800 bg-neutral-900",
        className
      )}
    >
      {children}
    </div>
  );
}
export function CardHeader({
  children,
  className,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("p-4 border-b border-neutral-800", className)}>
      {children}
    </div>
  );
}
export function CardContent({
  children,
  className,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
export function CardFooter({
  children,
  className,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("p-4 border-t border-neutral-800", className)}>
      {children}
    </div>
  );
}
