"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14F195]/50 disabled:opacity-50 disabled:pointer-events-none gap-2",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-neutral-100",
        primary:
          "bg-[#14F195] text-black font-semibold hover:bg-[#12d886] active:bg-[#10c078]",
        secondary:
          "bg-[#1a1a1a] text-white hover:bg-[#252525] border border-[#2a2a2a]",
        outline:
          "border border-[#2a2a2a] bg-transparent hover:bg-[#1a1a1a] text-white",
        ghost:
          "bg-transparent hover:bg-[#1a1a1a] text-[#8f8f8f] hover:text-white",
        destructive:
          "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
