import { cn } from "@/lib/utils";

interface AdBadgeProps {
  /** "compact" = single-letter pill (R), "full" = "Reklam" with label */
  variant?: "compact" | "full";
  className?: string;
}

/**
 * Discloses that a link is sponsored / affiliate, as required by
 * Marknadsföringslagen and Konsumentverkets riktlinjer. Render alongside any
 * affiliate-tagged content.
 */
export function AdBadge({ variant = "full", className }: AdBadgeProps) {
  if (variant === "compact") {
    return (
      <span
        title="Reklam"
        aria-label="Reklam"
        className={cn(
          "inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/15 text-[9px] font-bold text-foreground",
          className
        )}
      >
        R
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/80",
        className
      )}
    >
      Reklam
    </span>
  );
}
