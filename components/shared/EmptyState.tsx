import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "py-20 md:py-28 text-center flex flex-col items-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background-secondary">
          <Icon className="h-7 w-7 text-foreground-muted" strokeWidth={1.5} />
        </div>
      )}
      <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-md text-sm text-foreground-muted leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
