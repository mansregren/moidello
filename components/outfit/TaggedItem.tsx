import { ExternalLink } from "lucide-react";
import { TaggedItem as TaggedItemType } from "@/lib/types";
import { PremiumButton } from "../shared/PremiumButton";

interface TaggedItemProps {
  item: TaggedItemType;
}

export function TaggedItemCard({ item }: TaggedItemProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div>
        <p className="text-xs text-foreground-muted uppercase tracking-wider">
          {item.brand}
        </p>
        <p className="text-sm font-medium text-white mt-0.5">{item.name}</p>
        <p className="text-sm text-foreground-muted mt-0.5">
          {item.price.toLocaleString("sv-SE")} {item.currency}
        </p>
      </div>
      <a href={item.buyUrl} target="_blank" rel="noopener noreferrer">
        <PremiumButton variant="primary" size="sm">
          Köp
          <ExternalLink className="h-3 w-3" />
        </PremiumButton>
      </a>
    </div>
  );
}
