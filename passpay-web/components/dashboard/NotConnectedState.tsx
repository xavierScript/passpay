"use client";

import { PasskeySetup } from "@/components/PasskeySetup";

interface NotConnectedStateProps {
  /** Page title to display */
  title: string;
  /** Message to show the user */
  message?: string;
  /** Whether to show the passkey setup component */
  showSetup?: boolean;
}

/**
 * Consistent "not connected" state for dashboard pages
 *
 * @example
 * ```tsx
 * if (!isConnected) {
 *   return (
 *     <NotConnectedState
 *       title="Transfer SOL"
 *       message="Please connect your wallet to send SOL."
 *     />
 *   );
 * }
 * ```
 */
export function NotConnectedState({
  title,
  message = "Please connect your wallet to continue.",
  showSetup = false,
}: NotConnectedStateProps) {
  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-4 text-[#8f8f8f]">{message}</p>
        {showSetup && (
          <div className="mt-8">
            <PasskeySetup onConnected={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}
