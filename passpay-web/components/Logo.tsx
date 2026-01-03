import Image from "next/image";

interface LogoProps {
  /** Size of the logo in pixels */
  size?: number;
  /** Whether to show the text alongside the logo */
  showText?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PassPay Logo Component
 *
 * Displays the PassPay logo with optional text and customizable size.
 *
 * @example
 * ```tsx
 * // Small logo without text
 * <Logo size={24} />
 *
 * // Large logo with text
 * <Logo size={40} showText />
 * ```
 */
export function Logo({
  size = 32,
  showText = false,
  className = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/passpay-icon.png"
        alt="PassPay Logo"
        width={size}
        height={size}
        className="rounded-lg"
        priority
      />
      {showText && (
        <span className="text-xl font-bold text-white tracking-tight">
          PassPay
        </span>
      )}
    </div>
  );
}
