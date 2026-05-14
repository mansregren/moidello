"use client";

import { useGender } from "@/lib/gender-context";
import { useToast, haptic } from "@/lib/toast-context";
import { GenderFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { id: GenderFilter; label: string; toast: string }[] = [
  { id: "dam", label: "Dam", toast: "Visar Dam-outfits" },
  { id: "herr", label: "Herr", toast: "Visar Herr-outfits" },
];

export function GenderToggle({
  orientation = "horizontal",
  className,
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  const { gender, setGender } = useGender();
  const { showToast } = useToast();

  const handleSelect = (opt: (typeof OPTIONS)[number]) => {
    if (opt.id === gender) return;
    setGender(opt.id);
    showToast(opt.toast);
    haptic(8);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Visa kön"
      className={cn(
        "rounded-full border border-border bg-background-secondary p-0.5",
        orientation === "horizontal"
          ? "inline-flex items-center"
          : "flex flex-col items-stretch gap-0.5",
        className
      )}
    >
      {OPTIONS.map((opt) => {
        const active = gender === opt.id;
        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={active}
            onClick={() => handleSelect(opt)}
            className={cn(
              "rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all duration-300",
              orientation === "horizontal"
                ? "px-3 py-1.5"
                : "px-2 py-1.5 text-center",
              active
                ? "bg-foreground text-background"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
