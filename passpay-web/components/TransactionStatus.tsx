import React from "react";

export function TransactionStatus({
  status,
  signature,
}: {
  status: "idle" | "pending" | "success" | "error";
  signature?: string;
}) {
  if (status === "idle") return null;
  if (status === "pending")
    return <p className="text-sm text-neutral-300">Transaction pending...</p>;
  if (status === "success")
    return (
      <p className="text-sm text-green-400">
        Success.{" "}
        <a
          className="underline"
          href={`https://solscan.io/tx/${signature}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
        >
          View on Solscan
        </a>
      </p>
    );
  return <p className="text-sm text-red-400">Transaction failed. Try again.</p>;
}
