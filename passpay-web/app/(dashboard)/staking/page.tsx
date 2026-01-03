/**
 * Staking Page - Native SOL Staking
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TUTORIAL: Staking SOL with Passkey Authentication
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This page demonstrates complex multi-instruction transactions:
 * - Create a stake account (using createAccountWithSeed)
 * - Delegate stake to a validator
 * - View existing stake accounts and their status
 */

"use client";

import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStaking } from "@/hooks";
import {
  PageHeader,
  NotConnectedState,
  BalanceCard,
  InfoBanner,
} from "@/components/dashboard";
import {
  DEVNET_VALIDATORS,
  MIN_STAKE_AMOUNT,
  formatSol,
  getStateBadgeColor,
} from "@/lib/services";
import { getAddressExplorerUrl, truncateAddress } from "@/lib/services";

export default function StakingPage() {
  const { isConnected } = useWallet();
  const { stake, staking, balance, stakeAccounts, loading, refresh } =
    useStaking();

  const [amount, setAmount] = useState("");
  const [selectedValidator, setSelectedValidator] = useState<string>(
    DEVNET_VALIDATORS[0].voteAccount
  );

  const handleStake = async () => {
    const signature = await stake(amount, selectedValidator);
    if (signature) {
      setAmount("");
    }
  };

  if (!isConnected) {
    return (
      <NotConnectedState
        title="SOL Staking"
        message="Please connect your wallet to stake SOL."
      />
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          icon="🥩"
          title="SOL Staking"
          description="Stake SOL to validators and earn rewards"
        />

        <BalanceCard
          label="Available to Stake"
          balance={balance}
          loading={loading}
          onRefresh={refresh}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Stake Form */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Stake SOL</h2>
              <p className="text-sm text-[#8f8f8f]">
                Delegate to a validator and earn rewards
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#8f8f8f]">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ${MIN_STAKE_AMOUNT} SOL`}
                  step="0.01"
                  min={MIN_STAKE_AMOUNT}
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-white placeholder-[#8f8f8f] focus:border-[#14F195] focus:outline-none focus:ring-1 focus:ring-[#14F195]"
                />
              </div>

              {/* Validator Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#8f8f8f]">
                  Select Validator
                </label>
                <div className="space-y-2">
                  {DEVNET_VALIDATORS.map((validator) => (
                    <button
                      key={validator.voteAccount}
                      onClick={() =>
                        setSelectedValidator(validator.voteAccount)
                      }
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        selectedValidator === validator.voteAccount
                          ? "border-[#14F195] bg-[#14F195]/20"
                          : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#8f8f8f]"
                      }`}
                    >
                      <p className="font-medium">{validator.name}</p>
                      <p className="text-xs text-[#8f8f8f] font-mono">
                        {truncateAddress(validator.voteAccount, 8)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake Button */}
              <Button
                onClick={handleStake}
                disabled={staking || !amount || !selectedValidator}
                className="w-full"
                size="lg"
              >
                {staking ? "Staking..." : "Stake SOL 🥩"}
              </Button>

              <InfoBanner icon="📝">
                <strong>Note:</strong> Staking uses createAccountWithSeed to
                avoid needing additional signers - perfect for LazorKit&apos;s
                passkey-only signing.
              </InfoBanner>
            </CardContent>
          </Card>

          {/* Stake Accounts */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Your Stake Accounts</h2>
              <p className="text-sm text-[#8f8f8f]">
                Active delegations and their status
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-[#8f8f8f]">
                  Loading stake accounts...
                </div>
              ) : stakeAccounts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[#8f8f8f]">No stake accounts yet</p>
                  <p className="mt-1 text-xs text-[#666666]">
                    Stake some SOL to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stakeAccounts.map((account) => (
                    <div
                      key={account.address}
                      className="rounded-lg border border-[#1a1a1a] bg-[#1a1a1a]/50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-sm">
                            {truncateAddress(account.address, 6)}
                          </p>
                          <p className="text-lg font-bold text-white">
                            {formatSol(account.lamports)} SOL
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium capitalize ${getStateBadgeColor(
                            account.state
                          )}`}
                        >
                          {account.state}
                        </span>
                      </div>
                      {account.validator && (
                        <p className="mt-2 text-xs text-[#8f8f8f]">
                          Validator: {truncateAddress(account.validator, 6)}
                        </p>
                      )}
                      <a
                        href={getAddressExplorerUrl(account.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-[#14F195] hover:text-[#14F195]/80"
                      >
                        View on Explorer ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="border-[#14F195]/30 bg-[#14F195]/10">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-[#14F195]">⚡ Gasless</p>
              <p className="mt-1 text-xs text-[#14F195]/70">
                Transaction fees paid by LazorKit paymaster
              </p>
            </CardContent>
          </Card>
          <Card className="border-[#14F195]/30 bg-[#14F195]/10">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-[#14F195]">🔐 Secure</p>
              <p className="mt-1 text-xs text-[#14F195]/70">
                Sign with biometrics - no seed phrase needed
              </p>
            </CardContent>
          </Card>
          <Card className="border-[#14F195]/30 bg-[#14F195]/10">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-[#14F195]">📈 Earn</p>
              <p className="mt-1 text-xs text-[#14F195]/70">
                Earn staking rewards from validators
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
