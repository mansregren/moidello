"use client";

import { usePathname, useRouter } from "next/navigation";
import { useGender } from "@/lib/gender-context";
import { useToast, haptic } from "@/lib/toast-context";
import { GenderFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS: { id: GenderFilter; label: string; toast: string }[] = [
  { id: "dam", label: "Dam", toast: "Visar Dam-outfits" },
  { id: "herr", label: "Herr", toast: "Visar Herr-outfits" },
];

// Where Dam/Herr send you when you tap them while inside the home vertical.
const MODE_EXIT_PATH = "/upptack";
const HOME_PATH = "/home";

/**
 * Dam / Herr / Hem. Dam and Herr are the real gender filter (binary, lives
 * in gender-context). "Hem" is NOT a gender value — it's a navigation into
 * the heminredning vertical at /home. Inside /home the Hem pill is active
 * and tapping Dam/Herr sets the gender and routes back to the fashion side,
 * so the mode filter logic never sees a third value.
 */
export function GenderToggle({
  orientation = "horizontal",
  className,
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  const { gender, setGender } = useGender();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname?.startsWith(HOME_PATH) ?? false;

  const handleGender = (opt: (typeof GENDER_OPTIONS)[number]) => {
    const alreadyActive = !isHome && opt.id === gender;
    setGender(opt.id);
    haptic(8);
    if (isHome) {
      // Leaving the home vertical back to the fashion browse.
      router.push(MODE_EXIT_PATH);
      return;
    }
    if (!alreadyActive) showToast(opt.toast);
  };

  const handleHome = () => {
    if (isHome) return;
    haptic(8);
    router.push(HOME_PATH);
  };

  const pillBase = cn(
    // transition-colors (not transition-all) so only the bg/text animate —
    // transition-all also tweens layout and felt laggy on mobile.
    "rounded-full font-semibold uppercase tracking-wide transition-colors duration-150",
    orientation === "horizontal"
      ? "px-2 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-[11px]"
      : "px-2 py-1.5 text-center text-[11px]",
  );

  return (
    <div
      role="radiogroup"
      aria-label="Visa kategori"
      className={cn(
        "rounded-full border border-border bg-background-secondary p-0.5",
        orientation === "horizontal"
          ? "inline-flex items-center"
          : "flex flex-col items-stretch gap-0.5",
        className,
      )}
    >
      {GENDER_OPTIONS.map((opt) => {
        const active = !isHome && gender === opt.id;
        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={active}
            onClick={() => handleGender(opt)}
            className={cn(
              pillBase,
              active
                ? "bg-foreground text-background"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
      <button
        role="radio"
        aria-checked={isHome}
        onClick={handleHome}
        className={cn(
          pillBase,
          isHome
            ? "bg-foreground text-background"
            : "text-foreground-muted hover:text-foreground",
        )}
      >
        Hem
      </button>
    </div>
  );
}
