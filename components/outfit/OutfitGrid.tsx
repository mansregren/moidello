import { Outfit } from "@/lib/types";
import { OutfitCard } from "./OutfitCard";

interface OutfitGridProps {
  outfits: Outfit[];
  columns?: 2 | 3 | 4;
}

export function OutfitGrid({ outfits, columns = 3 }: OutfitGridProps) {
  // Distribute outfits into columns for masonry layout
  const cols: Outfit[][] = Array.from({ length: columns }, () => []);
  outfits.forEach((outfit, i) => {
    cols[i % columns].push(outfit);
  });

  return (
    <div
      className={`grid gap-6 ${
        columns === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : columns === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      }`}
    >
      {cols.map((col, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-6">
          {col.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} />
          ))}
        </div>
      ))}
    </div>
  );
}
