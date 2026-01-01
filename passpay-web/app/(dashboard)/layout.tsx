"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { MobileNav } from "@/components/MobileNav";

const navItems = [
  { href: "/manage", label: "Dashboard", icon: "🏠" },
  { href: "/transfer", label: "Transfer", icon: "💸" },
  { href: "/memo", label: "Memo", icon: "📝" },
  { href: "/staking", label: "Staking", icon: "🥩" },
  { href: "/subscribe", label: "Subscribe", icon: "💳" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-black/95 backdrop-blur-md px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <MobileNav navItems={navItems} />

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🔐</span>
            <span className="text-xl font-bold text-white tracking-tight">
              PassPay
            </span>
            <span className="hidden sm:inline-block rounded-full bg-[#14F195]/15 px-2 py-0.5 text-[10px] font-medium text-[#14F195] uppercase tracking-wide">
              Devnet
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#14F195]/10 text-[#14F195]"
                      : "text-[#8f8f8f] hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Wallet Connect */}
          <WalletConnect />
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] bg-black px-6 py-4 mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#8f8f8f]">
          <div className="flex items-center gap-2">
            <span>🔐</span>
            <span>PassPay - Powered by LazorKit</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://docs.lazorkit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#14F195] transition-colors"
            >
              LazorKit Docs ↗
            </a>
            <a
              href="https://explorer.solana.com/?cluster=devnet"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#14F195] transition-colors"
            >
              Solana Explorer ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
