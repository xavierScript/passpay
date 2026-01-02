"use client";

import { Card, CardContent } from "@/components/ui/card";

type InfoBannerVariant = "info" | "warning" | "success" | "gasless";

interface InfoBannerProps {
  /** Emoji icon to display */
  icon?: string;
  /** Banner title */
  title?: string;
  /** Banner content */
  children: React.ReactNode;
  /** Style variant */
  variant?: InfoBannerVariant;
}

const variantStyles: Record<
  InfoBannerVariant,
  { border: string; bg: string; title: string; text: string }
> = {
  info: {
    border: "border-[#1a1a1a]",
    bg: "bg-[#0a0a0a]",
    title: "text-white",
    text: "text-[#8f8f8f]",
  },
  warning: {
    border: "border-amber-800",
    bg: "bg-amber-900/20",
    title: "text-amber-200",
    text: "text-amber-200/70",
  },
  success: {
    border: "border-[#14F195]/20",
    bg: "bg-[#14F195]/5",
    title: "text-[#14F195]",
    text: "text-[#14F195]/70",
  },
  gasless: {
    border: "border-[#1a1a1a]",
    bg: "bg-[#0a0a0a]",
    title: "text-white",
    text: "text-[#8f8f8f]",
  },
};

/**
 * Reusable info/warning banner component
 *
 * @example
 * ```tsx
 * <InfoBanner icon="💡" title="What is a Memo?" variant="warning">
 *   Memos are text messages stored permanently in Solana transactions.
 * </InfoBanner>
 *
 * <InfoBanner icon="⚡" variant="gasless">
 *   <strong>Gasless:</strong> Transaction fees are covered by LazorKit's paymaster.
 * </InfoBanner>
 * ```
 */
export function InfoBanner({
  icon,
  title,
  children,
  variant = "info",
}: InfoBannerProps) {
  const styles = variantStyles[variant];

  // Simple inline variant (no title, compact)
  if (!title) {
    return (
      <div className={`rounded-lg border ${styles.border} ${styles.bg} p-3`}>
        <p className={`text-xs ${styles.text}`}>
          {icon && <span>{icon} </span>}
          {children}
        </p>
      </div>
    );
  }

  // Full banner variant with title
  return (
    <Card className={`mb-6 ${styles.border} ${styles.bg}`}>
      <CardContent className="pt-6">
        <div className="flex gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <div>
            <p className={`font-medium ${styles.title}`}>{title}</p>
            <p className={`mt-1 text-sm ${styles.text}`}>{children}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
