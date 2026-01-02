"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BalanceCardProps {
  /** Balance label */
  label?: string;
  /** Balance amount in SOL */
  balance: number | null;
  /** Whether balance is loading */
  loading?: boolean;
  /** Refresh callback */
  onRefresh?: () => void;
  /** Variant style */
  variant?: "default" | "highlight";
}

/**
 * Reusable balance display card with refresh button
 *
 * @example
 * ```tsx
 * <BalanceCard
 *   label="Available Balance"
 *   balance={4.5}
 *   loading={false}
 *   onRefresh={refreshBalance}
 *   variant="highlight"
 * />
 * ```
 */
export function BalanceCard({
  label = "Available Balance",
  balance,
  loading = false,
  onRefresh,
  variant = "default",
}: BalanceCardProps) {
  const borderColor =
    variant === "highlight" ? "border-[#14F195]/20" : "border-[#14F195]/30";
  const bgColor = variant === "highlight" ? "bg-[#14F195]/5" : "bg-[#14F195]/5";

  return (
    <Card className={`mb-6 ${borderColor} ${bgColor}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#8f8f8f]">{label}</p>
            <p className="text-2xl font-bold">
              {loading ? (
                <span className="text-[#8f8f8f]">Loading...</span>
              ) : (
                <span className="text-[#14F195]">
                  {balance?.toFixed(4) ?? "0"} SOL
                </span>
              )}
            </p>
          </div>
          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
