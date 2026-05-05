"use client";

import { motion } from "framer-motion";
import { useGender } from "@/lib/gender-context";
import { useToast, haptic } from "@/lib/toast-context";
import { GenderFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { id: GenderFilter; label: string; toast: string }[] = [
  { id: "dam", label: "Dam", toast: "Visar Dam-outfits" },
  { id: "both", label: "Båda", toast: "Visar alla outfits" },
  { id: "herr", label: "Herr", toast: "Visar Herr-outfits" },
];

interface GenderToggleProps {
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md";
  className?: string;
  /** Unique id for the layoutId — required if multiple toggles render simultaneously. */
  layoutGroup?: string;
}

export function GenderToggle({
  orientation = "horizontal",
  size = "sm",
  className,
  layoutGroup = "gender-toggle",
}: GenderToggleProps) {
  const { gender, setGender } = useGender();
  const { showToast } = useToast();

  const handleSelect = (opt: (typeof OPTIONS)[number]) => {
    if (opt.id === gender) return;
    setGender(opt.id);
    showToast(opt.toast);
    haptic(10);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Visa kön"
      className={cn(
        "rounded-full border border-white/10 bg-white/5 backdrop-blur-md p-0.5",
        orientation === "horizontal"
          ? "inline-flex items-center"
          : "flex flex-col items-stretch gap-0.5",
        className
      )}
    >
      {OPTIONS.map((opt) => {
        const active = gender === opt.id;
        return (
          <motion.button
            key={opt.id}
            role="radio"
            aria-checked={active}
            onClick={() => handleSelect(opt)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative rounded-full font-semibold uppercase tracking-wider transition-colors",
              size === "sm" ? "text-[11px]" : "text-xs",
              orientation === "horizontal"
                ? size === "sm"
                  ? "px-3 py-1"
                  : "px-4 py-1.5"
                : "px-2 py-1.5 text-center",
              active ? "text-black" : "text-white/60 hover:text-white"
            )}
          >
            {active && (
              <motion.span
                layoutId={`${layoutGroup}-pill`}
                className="absolute inset-0 rounded-full bg-white"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
