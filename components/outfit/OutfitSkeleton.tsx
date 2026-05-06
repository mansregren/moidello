import { cn } from "@/lib/utils";

export function OutfitSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] w-full rounded-2xl bg-background-tertiary" />
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-background-tertiary" />
          <div className="h-3 w-24 rounded bg-background-tertiary" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 w-8 rounded bg-background-tertiary" />
          <div className="h-3 w-8 rounded bg-background-tertiary" />
        </div>
      </div>
    </div>
  );
}

interface OutfitGridSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4;
}

export function OutfitGridSkeleton({
  count = 8,
  columns = 4,
}: OutfitGridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-6",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <OutfitSkeleton key={i} />
      ))}
    </div>
  );
}
