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
 *
 * WHY USE createAccountWithSeed?
 * ------------------------------
 * Normally, creating a stake account requires a NEW keypair that must
 * sign the transaction. But LazorKit only provides the smart wallet signer.
 *
 * Solution: Use `createAccountWithSeed()` which derives the account address
 * from the wallet's public key + a seed string. No additional signers needed!
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@lazorkit/wallet";
import { PublicKey, Connection } from "@solana/web3.js";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  createStakeAccountInstructions,
  getStakeAccounts,
  DEVNET_VALIDATORS,
  MIN_STAKE_AMOUNT,
  formatSol,
  getStateBadgeColor,
  StakeAccountInfo,
} from "@/lib/services/staking";
import { getSolBalance } from "@/lib/services/rpc";
import {
  getAddressExplorerUrl,
  truncateAddress,
} from "@/lib/services/transfer";
import { DEFAULT_CONFIG } from "@/lib/constants";

export default function StakingPage() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();

  const [amount, setAmount] = useState("");
  const [selectedValidator, setSelectedValidator] = useState<string>(
    DEVNET_VALIDATORS[0].voteAccount
  );
  const [stakeAccounts, setStakeAccounts] = useState<StakeAccountInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [staking, setStaking] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const hasFetchedRef = useRef(false);

  // Create connection instance
  const getConnection = useCallback(() => {
    return new Connection(DEFAULT_CONFIG.rpcUrl, "confirmed");
  }, []);

  // Fetch balance and stake accounts
  const fetchData = useCallback(async () => {
    if (!smartWalletPubkey) return;

    setLoading(true);
    try {
      const connection = getConnection();

      // Fetch in parallel
      const [balance, accounts] = await Promise.all([
        getSolBalance(smartWalletPubkey),
        getStakeAccounts(connection, smartWalletPubkey),
      ]);

      setSolBalance(balance);
      setStakeAccounts(accounts);
    } catch (error) {
      console.error("Error fetching staking data:", error);
    } finally {
      setLoading(false);
    }
  }, [smartWalletPubkey, getConnection]);

  useEffect(() => {
    if (isConnected && smartWalletPubkey && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [isConnected, smartWalletPubkey, fetchData]);

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * 📚 TUTORIAL: Creating a Stake Account with LazorKit
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * STEP 1: Validate inputs and check balance
   * STEP 2: Create stake instructions using createAccountWithSeed
   * STEP 3: Sign and send the bundled transaction with paymaster
   */
  const handleStake = async () => {
    if (!isConnected || !smartWalletPubkey) {
      toast.error("Please connect your wallet first");
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue < MIN_STAKE_AMOUNT) {
      toast.error(`Minimum stake is ${MIN_STAKE_AMOUNT} SOL`);
      return;
    }

    if (solBalance !== null && amountValue > solBalance - 0.01) {
      toast.error("Insufficient balance (keep some for rent)");
      return;
    }

    if (!selectedValidator) {
      toast.error("Please select a validator");
      return;
    }

    setStaking(true);
    const toastId = toast.loading("Creating stake account...");

    try {
      const connection = getConnection();
      const validatorPubkey = new PublicKey(selectedValidator);

      // Create stake instructions (uses seed - no additional signer needed!)
      const { instructions, stakeAccountPubkey } =
        await createStakeAccountInstructions(
          connection,
          smartWalletPubkey,
          amountValue,
          validatorPubkey
        );

      toast.loading("Approve with your passkey...", { id: toastId });

      // Sign and send with paymaster
      const signature = await signAndSendTransaction({
        instructions,
        transactionOptions: {
          feeToken: "USDC",
        },
      });

      toast.dismiss(toastId);
      toast.success("Stake delegated successfully! 🎉");

      // Clear form and refresh
      setAmount("");
      fetchData();
    } catch (error: unknown) {
      toast.dismiss(toastId);
      const message = error instanceof Error ? error.message : "Staking failed";
      toast.error(message);
      console.error("Staking failed:", error);
    } finally {
      setStaking(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold">SOL Staking</h1>
          <p className="mt-4 text-[#8f8f8f]">
            Please connect your wallet to stake SOL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">🥩 SOL Staking</h1>
          <p className="mt-2 text-[#8f8f8f]">
            Stake SOL to validators and earn rewards
          </p>
        </div>

        {/* Balance Card */}
        <Card className="mb-6 border-[#14F195]/30 bg-[#14F195]/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8f8f8f]">Available to Stake</p>
                <p className="text-2xl font-bold">
                  {loading ? (
                    <span className="text-[#8f8f8f]">Loading...</span>
                  ) : (
                    <>{solBalance?.toFixed(4) ?? "0"} SOL</>
                  )}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchData}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

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

              {/* Info */}
              <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-3">
                <p className="text-xs text-[#8f8f8f]">
                  📝 <strong>Note:</strong> Staking uses createAccountWithSeed
                  to avoid needing additional signers - perfect for
                  LazorKit&apos;s passkey-only signing.
                </p>
              </div>
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
