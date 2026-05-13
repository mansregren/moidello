export function OutfitGridSkeleton({
  columns = 3,
  count = 6,
}: {
  columns?: 2 | 3 | 4;
  count?: number;
}) {
  const grid =
    columns === 2
      ? "grid-cols-2"
      : columns === 3
        ? "grid-cols-2 lg:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  return (
    <div className={`grid gap-3 sm:gap-6 ${grid}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-2xl bg-foreground-subtle/5 animate-pulse"
        />
      ))}
    </div>
  );
}
