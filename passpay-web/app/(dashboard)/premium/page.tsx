"use client";
export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <h1 className="text-4xl font-bold">Premium Content</h1>
      <p className="mt-4 text-[#8f8f8f]">
        Welcome to exclusive content only available to subscribed users.
      </p>
      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4">
          <h2 className="text-xl font-semibold">Premium Video 1</h2>
          <p className="text-sm text-[#8f8f8f]">
            Exclusive tutorial on building smart contracts.
          </p>
        </div>
        <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4">
          <h2 className="text-xl font-semibold">Premium Video 2</h2>
          <p className="text-sm text-[#8f8f8f]">
            Deep dive into Solana architecture.
          </p>
        </div>
      </div>
    </div>
  );
}
