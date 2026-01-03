"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Logo } from "@/components";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface MobileNavProps {
  navItems: NavItem[];
}

export function MobileNav({ navItems }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex flex-col justify-center items-center gap-1.5 w-10 h-10 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#303030] transition-colors"
        aria-label="Open menu"
      >
        <span className="w-5 h-0.5 bg-white rounded-full" />
        <span className="w-5 h-0.5 bg-white rounded-full" />
        <span className="w-5 h-0.5 bg-white rounded-full" />
      </button>

      {/* Mobile Menu Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>
                <div className="flex items-center gap-2.5">
                  <Logo size={28} showText />
                  <span className="rounded-full bg-[#14F195]/15 px-2 py-0.5 text-[10px] font-medium text-[#14F195] uppercase tracking-wide">
                    Devnet
                  </span>
                </div>
              </SheetTitle>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1a1a] hover:bg-[#252525] transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="w-5 h-5 text-[#8f8f8f]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </SheetHeader>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-4 py-5">
            <p className="text-[11px] font-semibold text-[#8f8f8f] uppercase tracking-wider mb-3 px-3">
              Navigation
            </p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${
                      isActive
                        ? "bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20"
                        : "text-[#8f8f8f] hover:text-white hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#14F195]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer Links */}
          <div className="shrink-0 border-t border-[#1a1a1a] bg-black px-4 py-4">
            <p className="text-[10px] font-semibold text-[#8f8f8f] uppercase tracking-wider mb-2 px-3">
              Resources
            </p>
            <div className="space-y-1">
              <a
                href="https://docs.lazorkit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8f8f8f] hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                <span>📚</span>
                <span>LazorKit Docs</span>
                <span className="ml-auto text-xs text-[#8f8f8f]">↗</span>
              </a>
              <a
                href="https://explorer.solana.com/?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8f8f8f] hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                <span>🔍</span>
                <span>Solana Explorer</span>
                <span className="ml-auto text-xs text-[#8f8f8f]">↗</span>
              </a>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
