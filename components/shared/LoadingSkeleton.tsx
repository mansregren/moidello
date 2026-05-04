import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-background-tertiary",
        className
      )}
    />
  );
}

export function OutfitCardSkeleton() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton className="aspect-[3/4] w-full" />
      <div className="flex items-center gap-3">
        <LoadingSkeleton className="h-8 w-8 rounded-full" />
        <LoadingSkeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
