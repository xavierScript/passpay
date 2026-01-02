"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getExplorerUrl } from "@/lib/services/transfer";

interface HistoryItem {
  /** Primary display text */
  primary: string;
  /** Secondary text (optional) */
  secondary?: string;
  /** Transaction signature */
  signature: string;
  /** Timestamp */
  timestamp: Date;
}

interface HistoryListProps {
  /** Section title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** List of history items */
  items: HistoryItem[];
  /** Custom render for primary text */
  renderPrimary?: (item: HistoryItem) => React.ReactNode;
}

/**
 * Reusable transaction history list component
 *
 * @example
 * ```tsx
 * <HistoryList
 *   title="Recent Transfers"
 *   items={history.map(tx => ({
 *     primary: `${tx.amount} SOL → ${truncateAddress(tx.recipient)}`,
 *     signature: tx.signature,
 *     timestamp: tx.timestamp,
 *   }))}
 * />
 * ```
 */
export function HistoryList({
  title,
  subtitle,
  items,
  renderPrimary,
}: HistoryListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-[#8f8f8f]">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-[#1a1a1a] bg-[#1a1a1a]/50 p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {renderPrimary ? renderPrimary(item) : item.primary}
                </p>
                {item.secondary && (
                  <p className="text-xs text-[#8f8f8f]">{item.secondary}</p>
                )}
                <p className="text-xs text-[#8f8f8f]">
                  {item.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <a
                href={getExplorerUrl(item.signature)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#14F195] hover:text-[#14F195]/80"
              >
                View ↗
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
