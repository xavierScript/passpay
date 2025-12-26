"use client";
import { WalletConnect } from "@/components/WalletConnect";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className="border-b border-neutral-800 bg-neutral-950 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">PassPay</h1>
          <div className="flex items-center gap-4 text-sm text-neutral-300">
            <a href="/subscribe" className="hover:text-white">
              Subscribe
            </a>
            <a href="/manage" className="hover:text-white">
              Dashboard
            </a>
            <a href="/premium" className="hover:text-white">
              Premium
            </a>
            <WalletConnect />
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
