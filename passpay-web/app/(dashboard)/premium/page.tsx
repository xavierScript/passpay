"use client";
export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-white">
      <h1 className="text-4xl font-bold">Premium Content</h1>
      <p className="mt-4 text-neutral-300">
        Welcome to exclusive content only available to subscribed users.
      </p>
      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="text-xl font-semibold">Premium Video 1</h2>
          <p className="text-sm text-neutral-400">
            Exclusive tutorial on building smart contracts.
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="text-xl font-semibold">Premium Video 2</h2>
          <p className="text-sm text-neutral-400">
            Deep dive into Solana architecture.
          </p>
        </div>
      </div>
    </div>
  );
}
