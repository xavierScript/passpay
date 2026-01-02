"use client";

interface PageHeaderProps {
  /** Emoji icon to display before the title */
  icon?: string;
  /** Page title */
  title: string;
  /** Page description/subtitle */
  description: string;
}

/**
 * Consistent page header for dashboard pages
 *
 * @example
 * ```tsx
 * <PageHeader
 *   icon="💸"
 *   title="Transfer SOL"
 *   description="Send SOL gaslessly - paymaster covers the fees ⚡"
 * />
 * ```
 */
export function PageHeader({ icon, title, description }: PageHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold">
        {icon && <span>{icon} </span>}
        {title}
      </h1>
      <p className="mt-2 text-[#8f8f8f]">{description}</p>
    </div>
  );
}
