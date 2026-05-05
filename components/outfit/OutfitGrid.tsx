import { Outfit } from "@/lib/types";
import { OutfitCard } from "./OutfitCard";

interface OutfitGridProps {
  outfits: Outfit[];
  columns?: 2 | 3 | 4;
}

export function OutfitGrid({ outfits, columns = 3 }: OutfitGridProps) {
  return (
    <div
      className={`grid gap-3 sm:gap-6 ${
        columns === 2
          ? "grid-cols-2"
          : columns === 3
          ? "grid-cols-2 lg:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      }`}
    >
      {outfits.map((outfit) => (
        <OutfitCard key={outfit.id} outfit={outfit} />
      ))}
    </div>
  );
}
